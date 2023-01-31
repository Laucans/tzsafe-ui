import {
  Contract,
  TezosToolkit,
  BigMapAbstraction,
  MichelsonMap,
} from "@taquito/taquito";
import { content } from "../types/006Proposal";
import { contractStorage } from "../types/app";
import { proposal, proposalContent, status } from "../types/display";
import { ownersForm } from "./forms";
import { Versioned } from "./interface";
import { Parser } from "@taquito/michel-codec";
import { BigNumber } from "bignumber.js";

class Version006 extends Versioned {
  async submitTxProposals(
    cc: Contract,
    t: TezosToolkit,
    proposals: {
      transfers: {
        type: "transfer" | "lambda";
        values: { [key: string]: string };
        fields: {
          field: string;
          label: string;
          path: string;
          placeholder: string;
          validate: (p: string) => string | undefined;
        }[];
      }[];
    }
  ): Promise<void> {
    let params = cc.methods
      .create_proposal(
        proposals.transfers.map((x) => {
          switch (x.type) {
            case "transfer":
              return {
                transfer: {
                  target: x.values.to,
                  amount: x.values.amount,
                  parameter: {},
                },
              };
            case "lambda":
              const p = new Parser();
              const michelsonCode = p.parseMichelineExpression(x.values.lambda);
              return {
                execute_lambda: michelsonCode,
              };
            default:
              return {};
          }
        })
      )
      .toTransferParams();
    let op = await t.wallet.transfer(params).send();
    await op.transactionOperation();
    await op.confirmation(1);
  }
  async signProposal(
    cc: Contract,
    t: TezosToolkit,
    proposal: number,
    _p: any,
    result: boolean
  ): Promise<void> {
    let params = cc.methods
      .sign_and_execute_proposal(proposal, result)
      .toTransferParams();
    let op = await t.wallet.transfer(params).send();
    await op.confirmation(1);
  }

  async submitSettingsProposals(
    cc: Contract,
    t: TezosToolkit,
    ops: ownersForm[]
  ) {
    let content = ops.map((v) => {
      if ("addOwners" in v) {
        return { add_signers: v.addOwners };
      } else if ("removeOwners" in v) {
        return { remove_signers: v.removeOwners };
      } else {
        return { adjust_threshold: v.changeThreshold };
      }
    });
    let params = cc.methods.create_proposal(content).toTransferParams();
    let op = await t.wallet.transfer(params).send();
    await op.transactionOperation();
  }
  static override toContractState(
    contract: any,
    balance: BigNumber
  ): contractStorage {
    let c: {
      proposal_counter: BigNumber;
      proposal_map: BigMapAbstraction;
      signers: string[];
      threshold: BigNumber;
    } = contract;
    return {
      balance: balance!.toString() || "0",
      proposal_map: c.proposal_map.toString(),
      proposal_counter: c.proposal_counter.toString(),
      threshold: c!.threshold.toNumber()!,
      signers: c!.signers!,
      version: "0.0.6",
    };
  }
  private static mapContent(content: content): proposalContent {
    if ("execute_lambda" in content) {
      return {
        executeLambda: {
          metadata: "no Metadata available",
          content: "Unable to display",
        },
      };
    } else if ("transfer" in content) {
      return {
        transfer: {
          amount: content.transfer.amount,
          destination: content.transfer.target,
        },
      };
    } else if ("add_signers" in content) {
      return {
        addOwners: content.add_signers,
      };
    } else if ("remove_signers" in content) {
      return {
        removeOwners: content.remove_signers,
      };
    } else if ("adjust_threshold" in content) {
      return {
        changeThreshold: content.adjust_threshold,
      };
    } else {
      throw new Error("should not possible!");
    }
  }

  static override toProposal(proposal: any): proposal {
    let prop: {
      signatures: MichelsonMap<string, boolean>;
      state: { active: Symbol } | { done: Symbol } | { closed: Symbol };
      content: content[];
      executed?: string;
      proposer: string;
      timestamp: string;
    } = proposal;
    const status: { [key: string]: status } = {
      active: "Proposing",
      done: "Executed",
      closed: "Rejected",
    };
    return {
      author: prop.proposer,
      status: status[Object.keys(prop.state)[0]!],
      content: prop.content.map(this.mapContent),
      signatures: [...prop.signatures.entries()].map(([k, v]) => ({
        signer: k,
        result: v,
      })),
    };
  }
}

export default Version006;