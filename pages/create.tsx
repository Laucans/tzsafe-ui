import React, { useContext, useEffect, useState } from "react";
import NavBar from "../components/navbar";
import FormContext from "../context/formContext";
import Stepper from "../components/stepper";
import Step from "../components/createStep";
import Meta from "../components/meta";
import { NetworkType } from "@airgap/beacon-sdk";
import { AppDispatchContext, AppStateContext } from "../context/state";
import { useRouter } from "next/navigation";
function Home() {

    const [formState, setFormState] = useState<any>(null)
    const [activeStepIndex, setActiveStepIndex] = useState(0)
    const [formStatus, setFormStatus] = useState("")
    const state = useContext(AppStateContext);
    const dispatch = useContext(AppDispatchContext);
    let router = useRouter()
    const connectWallet = async (): Promise<void> => {
        try {
            await state?.beaconWallet!.requestPermissions({
                network: {
                    type: NetworkType.GHOSTNET,
                }
            });
            const userAddress: string = await state?.beaconWallet!.getPKH()!;
            const balance = await state?.connection.tz.getBalance(userAddress);
            let s = await state?.beaconWallet!.client.getActiveAccount();
            dispatch!({ type: "login", accountInfo: s!, address: userAddress, balance: balance!.toString() })
        } catch (error) {
            router.replace("/")
        }
    };
    useEffect(() => {
        (async () => {
            if (!state?.address) {
                await connectWallet()
            }
        })()
    })
    return (
        <div>
            <Meta title={"Create wallet"} />

            <NavBar />
            <div className="bg-white shadow">
                <div className="mx-auto  max-w-7xl py-6 px-4 sm:px-6 lg:px-8 flex justify-start">
                    <h1 className="text-black text-3xl font-extrabold">
                        Create multisig wallet
                    </h1>
                </div>
            </div>
            <main className=" bg-gray-100">
                <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
                    <div className="px-4 py-6 sm:px-0">
                        <div className="md:min-h-96 min-h-fit rounded-lg border-4 border-dashed border-gray-200 grid-rows-2 md:grid-cols-2 md:grid-rows-1 grid p-2">
                            <div className="col-span-2 row-span-2 justify-items-center items-center flex flex-col">
                                <FormContext.Provider value={{ activeStepIndex: activeStepIndex, setActiveStepIndex, setFormState, formState, formStatus, setFormStatus }}>
                                    <Stepper />
                                    <Step />
                                </FormContext.Provider>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Home;