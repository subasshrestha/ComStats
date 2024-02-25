"use client"
import { AiOutlineSwap } from "react-icons/ai"
import { LiaCubesSolid } from "react-icons/lia"
import Image from "next/image"
import { RiStockLine } from "react-icons/ri"
import { CiCoinInsert } from "react-icons/ci"
import { TbBasketDollar } from "react-icons/tb"
import { PiUsersThreeBold, PiVaultFill } from "react-icons/pi"
import Button from "@/app/components/button"
import Footer from "@/app/components/footer"
import Navbar from "@/app/components/navbar"
import { useEffect, useState } from "react"
import StakingModal from "@/app/components/modal/stake"
import TransferModal from "@/app/components/modal/transfer"
import {
  useGetBalanceQuery,
  useGetTotalStatsQuery,
  useGetValidatorsByIdQuery,
  useGetValidatorsQuery,
} from "@/store/api/statsApi"
import { formatTokenPrice, truncateWalletAddress } from "@/utils"
import SearchWalletForm from "./components/forms/search"
import { VERIFIED_VALIDATORS } from "@/constants"
import { usePolkadot } from "@/context"
import { numberWithCommas } from "@/utils/numberWithCommas"
import Verified from "./components/verified"
import "react-tooltip/dist/react-tooltip.css"
import { FaSpinner } from "react-icons/fa6"

export default function Home() {
  const [stakingOpen, setStakingOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const { data: validatorData, isLoading: validatorLoading } =
    useGetValidatorsQuery(undefined, {
      pollingInterval: 300000,
    })
  const { isConnected, selectedAccount, blockNumber } = usePolkadot()
  const [walletAddress, setWalletAddress] = useState("")
  useEffect(() => {
    if (isConnected) {
      setWalletAddress(String(selectedAccount?.address))
    }
  }, [isConnected, selectedAccount])
  const { data: comStatsData, isLoading: comStatsLoading } =
    useGetValidatorsByIdQuery({
      key: String(process.env.NEXT_PUBLIC_COMSWAP_VALIDATOR),
      wallet: "",
    })
  const { data: chainData, isLoading: chainLoading } = useGetTotalStatsQuery(
    undefined,
    {
      pollingInterval: 8000,
    },
  )

  const {
    data: userBalance,
    isFetching: searchFetching,
    refetch: refetchSearch,
  } = useGetBalanceQuery(
    { wallet: walletAddress },
    {
      skip: !walletAddress && walletAddress === "",
    },
  )
  const comswapStats = [
    {
      id: 1,
      statsName: "Validator",
      icon: <LiaCubesSolid size={40} />,
      value: truncateWalletAddress(
        String(process.env.NEXT_PUBLIC_COMSWAP_VALIDATOR),
      ),
      description: (
        <div className="flex gap-x-1 items-center">{comStatsData?.name}</div>
      ),
    },
    {
      id: 2,
      statsName: "Current APY",
      icon: <RiStockLine size={40} />,
      value: `${(comStatsData?.apy ?? 0).toFixed(2)}%`,
      description: (
        <p>{(comStatsData?.apy ?? 0)?.toFixed(2)}% ROI over a year</p>
      ),
    },
    {
      id: 3,
      statsName: "Delegation fee",
      icon: <CiCoinInsert size={40} />,
      value: `${comStatsData?.delegation_fee ?? 0}%`,
      description: <p>Minimal fee of {comStatsData?.delegation_fee}%</p>,
    },
    {
      id: 4,
      statsName: "Total Staked",
      icon: <TbBasketDollar size={40} />,
      value:
        numberWithCommas(
          formatTokenPrice({
            amount: Number(comStatsData?.stake),
          }),
        ) ?? "0",
      description: (
        <p>
          {(
            Number(comStatsData?.stake) /
            10 ** 9 /
            Number(chainData?.total_stake)
          ).toFixed(3)}
          % of Total Staked
        </p>
      ),
    },
    {
      id: 5,
      statsName: "Total Stakers",
      icon: <PiUsersThreeBold size={40} />,
      value: comStatsData?.total_stakers,
      description: <p>Total Number of Stakers</p>,
    },
  ]
  const comswapStats1 = [
    {
      id: 1,
      statsName: "Price",
      icon: <LiaCubesSolid size={40} />,
      value: chainData?.price && `$${chainData?.price}`,
    },
    {
      id: 2,
      statsName: "Total Circulation",
      icon: <RiStockLine size={40} />,
      value: numberWithCommas(chainData?.circulating_supply?.toFixed(2)) ?? "0",
    },
    {
      id: 3,
      statsName: "Total Market Cap",
      icon: <CiCoinInsert size={40} />,
      value: `$${numberWithCommas((chainData?.marketcap ?? 0)?.toFixed(2))}`,
    },
    {
      id: 4,
      statsName: "Daily Emission",
      icon: <TbBasketDollar size={40} />,
      value: numberWithCommas(chainData?.daily_emission),
    },
    {
      id: 5,
      statsName: "Total Modules",
      icon: <PiUsersThreeBold size={40} />,
      value: numberWithCommas(chainData?.total_modules),
    },
    {
      id: 6,
      statsName: "Total Staked",
      icon: <PiUsersThreeBold size={40} />,
      value: numberWithCommas(chainData?.total_stake?.toFixed(2)),
    },
    {
      id: 7,
      statsName: "Total Stakers",
      icon: <PiUsersThreeBold size={40} />,
      value: numberWithCommas(chainData?.total_stakers),
    },
    {
      id: 7,
      statsName: "Total Subnets",
      icon: <PiUsersThreeBold size={40} />,
      value: numberWithCommas(chainData?.total_subnets),
    },
    {
      id: 8,
      statsName: "Average APY",
      icon: <PiUsersThreeBold size={40} />,
      value: chainData?.avg_apy && `${chainData?.avg_apy?.toFixed(2)}%`,
    },
  ]

  const [delegate, setDelegate] = useState("")
  function toggleAccordion(item: string): void {
    const content = document.getElementById(`content-${item}`)
    if (content) {
      if (content.classList.contains("hidden")) {
        content.classList.remove("hidden")
      } else {
        content.classList.add("hidden")
      }
    }
  }
  const userBalanceDollar = (userBalance?.balance ?? 0) * (chainData?.price ?? 0) / 10 ** 9
  const userStakedDollar = (userBalance?.staked ?? 0) * (chainData?.price ?? 0) / 10 ** 9
  return (
    <div>
      <Navbar />
      <section className="container">
        <div className="min-h-96 flex justify-center gap-y-4 flex-col items-center">
          <Image
            alt="blockchain"
            src="/Animated1.gif"
            height={150}
            width={150}
          />
          <div className="container text-center">
            <h1 className="text-4xl font-semibold text-textPrimary">
              ComStats
            </h1>
            <p className="text-md font-medium text-textSecondary mt-3">
              {/* An easiest platform to stake on Commune AI with minimal fees or no
              fees! */}
              All Statistics of CommuneAI at one place. Staking infrastructure,
              prices, validators, miners, swap, bridge, exchange for $COMAI
            </p>
          </div>

          <StakingModal
            open={stakingOpen}
            setOpen={setStakingOpen}
            validatorId={String(process.env.NEXT_PUBLIC_COMSWAP_VALIDATOR)}
          />
          <TransferModal open={transferOpen} setOpen={setTransferOpen} />
          <div className="container">
            <div className="flex justify-center w-full no-scrollbar p-5 flex-wrap gap-3">
              {comswapStats1.map((stats) => (
                <div
                  className="shadow-card rounded-xl flex items-center gap-x-4 p-4 w-full sm:w-1/2 md:w-1/3 lg:w-1/5 xl:w-1/6 truncate"
                  key={stats.id}
                >
                  <div className="text-purple">{stats.icon}</div>
                  <div>
                    <h4 className="text-xs uppercase font-normal text-grey-500">
                      {stats.statsName}
                    </h4>
                    <div className="text-md font-semibold w-full truncate tracking-tight">
                      {stats.value || "N/A"}
                    </div>
                    {/* <div className="text-[10px]">{stats.description}</div> */}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <div className="bg-button mx-3 p-5 rounded-lg shadow-lg text-white text-center my-10 sm:rounded-none sm:mx-0 sm:p-10">
        <h1 className="text-2xl font-bold mb-2">Enter your wallet address </h1>
        <p className="mb-4">
          Check balances, staking and many more with just a single input!
        </p>
        <div className="max-w-xl mx-auto">
          <SearchWalletForm
            wallet={walletAddress}
            setWallet={setWalletAddress}
            loading={searchFetching}
            refetch={refetchSearch}
          />
        </div>

        <div>
          <div>
          Balance:{" "}
          {numberWithCommas(
            Number(((userBalance?.balance || 0) / 10 ** 9).toFixed(2)),
          )}{" "}COMAI{" "}(${numberWithCommas(
            Number((userBalanceDollar).toFixed(2)),
          )})
          
          </div>
          <div>
          Staked:{" "}
          {numberWithCommas(
            Number(((userBalance?.staked || 0) / 10 ** 9).toFixed(2)),
          )}{" "}
          COMAI{" "}(${numberWithCommas(
            Number((userStakedDollar).toFixed(2)),
          )})
          </div>
         
        </div>
      </div>
      <section className="container my-10">
        <div className="flex justify-between mb-4 items-center flex-col gap-x-3 sm:flex-row">
          <h1 className="text-2xl text-left font-semibold flex leading-10 text-purple tracking-tighter items-center">
            <Image src="/Animated1.gif" alt="comm" height={30} width={30} />{" "}
            ComStats Statistics
          </h1>
        </div>

        <div className="shadow-card mx-4 p-8 rounded-xl flex gap-8 justify-between sm:m-0">
          {comswapStats.map((item) => (
            <div key={item.id} className="text-left w-full sm:w-1/5">
              <h6 className="text-xs uppercase font-normal text-grey-500">
                {item.statsName}
              </h6>
              <h1 className="text-md font-semibold w-full truncate tracking-tight">
                {item.value}
              </h1>
            </div>
          ))}
        </div>
        <div className="flex gap-4 flex-col justify-center p-4 sm:flex-row">
          <Button
            size="large"
            variant="primary"
            suffix={<PiVaultFill size={22} />}
            isDisabled={!isConnected}
            onClick={() => {
              setStakingOpen(true)
              setWalletAddress(String(selectedAccount?.address))
            }}
          >
            Manage Stake
          </Button>
          <Button
            size="large"
            variant="outlined"
            suffix={<AiOutlineSwap size={22} />}
            isDisabled={!isConnected}
            onClick={() => {
              setTransferOpen(true)
              setWalletAddress(String(selectedAccount?.address))
            }}
          >
            Transfer Funds
          </Button>
        </div>
      </section>
      <div className="bg-button mx-3 p-5 rounded-lg shadow-lg text-white text-center my-10 sm:rounded-none sm:mx-0 sm:p-10">
        <h1 className="text-2xl font-bold mb-2">Stake WCOMAI in one click?</h1>
        <p className="mb-4">
          Bring wCOMAI from Ethereum and stake in COMAI in a single go!
        </p>
        <p className="mb-4">Excited for it? So, are we.</p>
        <span className="italic font-semibold">Launching Soon on ComStats</span>
      </div>
      <section className="container my-10 ">
        <div className="flex justify-between mb-4 items-center flex-col sm:flex-row">
          <h1 className="text-2xl text-left font-semibold flex gap-x-2 leading-10 text-purple tracking-tighter items-center">
            <Image src="/CommAI.webp" alt="comm" height={30} width={30} /> COMAI
            Modules
          </h1>
        </div>

        <div className="shadow-2xl px-6 py-3 rounded-3xl mt-6">
          <table className="hidden sm:table border-separate w-full border-spacing-0">
            <thead>
              <tr className="uppercase text-xs  text-left font-semibold bottom-shadow">
                <th className="py-4 pl-3">S.N</th>
                <th>Modules</th>
                <th>Stakers</th>
                <th>Stake</th>
                <th>APY</th>
                <th>Fee</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {validatorData?.validators
                .toSorted((a, b) =>
                  a.key === process.env.NEXT_PUBLIC_COMSWAP_VALIDATOR ? -1 : 1,
                )
                .slice(0, 1000)
                .map((validator, index, array) => (
                  <tr
                    className={`text-sm font-medium   ${
                      index === array.length - 1
                        ? ""
                        : "border-b-2 bottom-shadow"
                    } `}
                    key={validator.key}
                  >
                    <td className="py-6 pl-3 ">{index + 1}</td>
                    <td>
                      <div className="flex flex-col">
                        <div className="flex items-center">
                          <h6 className="text-md font-bold flex gap-1">
                            {validator.name}{" "}
                            {VERIFIED_VALIDATORS.indexOf(validator.key) !==
                              -1 && <Verified />}
                          </h6>
                        </div>
                        <p className="text-[10px] text-textSecondary">
                          {validator.key}
                        </p>
                      </div>
                    </td>
                    <td>{numberWithCommas(validator.total_stakers)}</td>
                    <td>
                      {numberWithCommas(
                        formatTokenPrice({ amount: validator.stake }),
                      )}{" "}
                      COMAI
                    </td>
                    <td>{Number(validator.apy.toFixed(2))}%</td>
                    <td>
                      {Number((validator?.delegation_fee ?? 0).toFixed(2))}%
                    </td>
                    <td>
                      <Button
                        variant="primary"
                        size="large"
                        onClick={() => {
                          setDelegate(validator.key)
                          setWalletAddress(String(selectedAccount?.address))
                        }}
                        isDisabled={!isConnected}
                      >
                        Delegate
                      </Button>
                    </td>
                  </tr>
                ))}
              <StakingModal
                open={delegate !== ""}
                setOpen={(s) => setDelegate("")}
                validatorId={delegate}
              />
            </tbody>
          </table>
          {validatorLoading && <FaSpinner className="spinner my-6 mx-auto" />}
          <div className="sm:hidden">
            {validatorData?.validators.map((validator, index, array) => (
              <div
                key={validator.key}
                className={`py-4 ${
                  index === array.length - 1 ? "" : "border-b-2"
                }`}
                onClick={() => toggleAccordion(validator.name)}
              >
                <div className="flex justify-between items-center cursor-pointer">
                  <div className="flex gap-1 items-center">
                    {validator.name}{" "}
                    {VERIFIED_VALIDATORS.indexOf(validator.key) !== -1 && (
                      <Verified />
                    )}
                  </div>
                  <div>+</div>
                </div>
                <div id={`content-${validator.name}`} className="hidden">
                  <div className="py-2 flex flex-col">
                    <span>
                      <strong>Name:</strong> {validator.name}
                    </span>
                    <span className="text-[10px] text-textSecondary">
                      {validator.key}
                    </span>
                  </div>
                  <div className="py-2">
                    <strong>Stake:</strong>{" "}
                    {formatTokenPrice({ amount: validator.stake })} COM
                  </div>
                  <div className="py-2">
                    <strong>APY: </strong>
                    {Number(validator.apy.toFixed(2))}%
                  </div>
                  <div className="py-2">
                    <strong>Fee:</strong>{" "}
                    {Number(validator.delegation_fee.toFixed(2))}%
                  </div>
                  {/* <div className="py-2">
                    <strong>Action:</strong> Delegate
                  </div> */}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer
        copyrightText={`© ${new Date().getFullYear()} ComStats. All Rights Reserved.`}
      />
    </div>
  )
}
