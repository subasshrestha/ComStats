"use client"
import React, { createContext, useContext, useEffect, useState } from "react"
import { ApiPromise, WsProvider } from "@polkadot/api"
import { NET_ID, PLATFORM_FEE } from "@/constants"
import { IAddStaking, ITransfer, ITransferStaking } from "@/types"
import {
  InjectedAccountWithMeta,
  InjectedExtension,
} from "@polkadot/extension-inject/types"
import WalletModal from "@/app/components/modal/connect"
import { errorToast, successToast } from "@/app/components/toast"

interface PolkadotApiState {
  web3Accounts: (() => Promise<InjectedAccountWithMeta[]>) | null
  web3Enable: ((appName: string) => Promise<InjectedExtension[]>) | null
  web3FromAddress: ((address: string) => Promise<InjectedExtension>) | null
}

interface PolkadotContextType {
  api: ApiPromise | null
  isConnected: boolean
  isInitialized: boolean
  accounts: InjectedAccountWithMeta[]
  selectedAccount: InjectedAccountWithMeta | undefined
  handleConnect: () => void
  addStake: (args: IAddStaking) => void
  removeStake: (args: IAddStaking) => void
  transfer: (args: ITransfer) => void
  transferStake: (args: ITransferStaking) => void
}

const PolkadotContext = createContext<PolkadotContextType | undefined>(
  undefined,
)

interface PolkadotProviderProps {
  children: React.ReactNode
  wsEndpoint: string
}

export const PolkadotProvider: React.FC<PolkadotProviderProps> = ({
  children,
  wsEndpoint,
}) => {
  const [api, setApi] = useState<ApiPromise | null>(null)
  const [isInitialized, setIsInitialized] = useState<boolean>(false)
  const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [openModal, setOpenModal] = useState(false)
  const [polkadotApi, setPolkadotApi] = useState<PolkadotApiState>({
    web3Accounts: null,
    web3Enable: null,
    web3FromAddress: null,
  })
  async function loadPolkadotApi() {
    const { web3Accounts, web3Enable, web3FromAddress } = await import(
      "@polkadot/extension-dapp"
    )
    setPolkadotApi({
      web3Accounts,
      web3Enable,
      web3FromAddress,
    })
    const provider = new WsProvider(wsEndpoint)
    const newApi = await ApiPromise.create({ provider })
    setApi(newApi)
    setIsInitialized(true)
  }
  useEffect(() => {
    loadPolkadotApi()

    return () => {
      api?.disconnect()
    }
  }, [wsEndpoint])

  const handleConnect = async () => {
    if (!polkadotApi.web3Enable || !polkadotApi.web3Accounts) return
    const extensions = await polkadotApi.web3Enable("ComAISwap")
    if (!extensions) {
      throw Error("NO_EXTENSION_FOUND")
    }
    const allAccounts = await polkadotApi.web3Accounts()
    setAccounts(allAccounts)
    setOpenModal(true)
  }

  const [selectedAccount, setSelectedAccount] =
    useState<InjectedAccountWithMeta>()

  async function addStake({ validator, amount, callback }: IAddStaking) {
    if (!api || !selectedAccount || !polkadotApi.web3FromAddress) return
    const injector = await polkadotApi.web3FromAddress(selectedAccount.address)
    const amt = Number(amount) * 10 ** 9
    api.tx.subspaceModule
      .addStake(NET_ID, validator, amt)
      .signAndSend(selectedAccount.address, {
        signer: injector.signer,
      })
      .then((response) => {
        successToast("Transaction Done")
        callback?.()
      })
      .catch((err) => {
        errorToast(err)
      })
  }
  async function removeStake({ validator, amount, callback }: IAddStaking) {
    if (!api || !selectedAccount || !polkadotApi.web3FromAddress) return
    const injector = await polkadotApi.web3FromAddress(selectedAccount.address)
    const amt = Number(amount) * 10 ** 9
    api.tx.subspaceModule
      .removeStake(NET_ID, validator, amt)
      .signAndSend(selectedAccount.address, {
        signer: injector.signer,
      })
      .then((response) => {
        successToast("Transaction Done")
        callback?.()
      })
      .catch((err) => {
        errorToast(err)
      })
  }
  async function transferStake({
    validatorFrom,
    validatorTo,
    amount,
    callback,
  }: ITransferStaking) {
    if (!api || !selectedAccount || !polkadotApi.web3FromAddress) return
    const injector = await polkadotApi.web3FromAddress(selectedAccount.address)
    const amt = Number(amount) * 10 ** 9
    api.tx.subspaceModule
      .transferStake(NET_ID, validatorFrom, validatorTo, amt)
      .signAndSend(selectedAccount.address, {
        signer: injector.signer,
      })
      .then(() => {
        successToast("Transaction Done")
        callback?.()
      })
      .catch((err) => {
        errorToast(err)
      })
  }

  async function transfer({ to, amount, callback }: ITransfer) {
    if (!api || !selectedAccount || !polkadotApi.web3FromAddress) return
    const injector = await polkadotApi.web3FromAddress(selectedAccount.address)
    const amt = Number(amount) * 10 ** 9
    api.tx.balances
      .transfer(to, amt)
      .signAndSend(
        selectedAccount.address,
        { signer: injector.signer },
        (status) => {
          if (status.isCompleted) {
          }
        },
      ).then(() => {
        successToast("Transaction Done")
        callback?.()
      }).catch((err) => {
        errorToast(err)
      })
  }
  async function handleWalletSelections(wallet: InjectedAccountWithMeta) {
    setSelectedAccount(wallet)
    setIsConnected(true)
    setOpenModal(false)
  }

  return (
    <PolkadotContext.Provider
      value={{
        api,
        isInitialized,
        isConnected,
        accounts,
        selectedAccount,
        handleConnect,
        addStake,
        transfer,
        removeStake,
        transferStake,
      }}
    >
      <WalletModal
        open={openModal}
        setOpen={setOpenModal}
        wallets={accounts}
        handleWalletSelections={handleWalletSelections}
      />
      {children}
    </PolkadotContext.Provider>
  )
}

export const usePolkadot = (): PolkadotContextType => {
  const context = useContext(PolkadotContext)
  if (context === undefined) {
    throw new Error("usePolkadot must be used within a PolkadotProvider")
  }
  return context
}
