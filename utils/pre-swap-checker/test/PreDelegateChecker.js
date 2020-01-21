const Swap = artifacts.require('Swap')
const Types = artifacts.require('Types')
const Indexer = artifacts.require('Indexer')
const Delegate = artifacts.require('Delegate')
const PreSwapChecker = artifacts.require('PreSwapChecker')
const TransferHandlerRegistry = artifacts.require('TransferHandlerRegistry')
const ERC20TransferHandler = artifacts.require('ERC20TransferHandler')
const FungibleToken = artifacts.require('FungibleToken')
const WETH9 = artifacts.require('WETH9')

const { emitted, equal, reverted, ok } = require('@airswap/test-utils').assert
const { allowances, balances } = require('@airswap/test-utils').balances
const { orders, signatures } = require('@airswap/order-utils')
const {
  ERC20_INTERFACE_ID,
  GANACHE_PROVIDER,
} = require('@airswap/order-utils').constants

contract('PreSwapChecker', async accounts => {
  const aliceAddress = accounts[0]
  const bobAddress = accounts[1]
  const aliceTradeWallet = accounts[4]
  const PROTOCOL = '0x0002'
  const UNKNOWN_KIND = '0x1234'
  let preSwapChecker
  let aliceDelegate
  let swapContract
  let swapAddress

  let indexer

  let tokenAST
  let tokenDAI
  let tokenWETH
  let typesLib
  let errorCodes

  describe('Deploying...', async () => {
    it('Deployed Swap contract', async () => {
      typesLib = await Types.new()
      await Swap.link('Types', typesLib.address)

      const erc20TransferHandler = await ERC20TransferHandler.new()
      const transferHandlerRegistry = await TransferHandlerRegistry.new()
      await transferHandlerRegistry.addTransferHandler(
        ERC20_INTERFACE_ID,
        erc20TransferHandler.address
      )

      // now deploy swap
      swapContract = await Swap.new(transferHandlerRegistry.address)
      swapAddress = swapContract.address

      orders.setVerifyingContract(swapAddress)
    })

    it('Deployed test contract "WETH"', async () => {
      tokenWETH = await WETH9.new()
    })

    it('Deployed SwapChecker contract', async () => {
      await PreSwapChecker.link('Types', typesLib.address)
      preSwapChecker = await PreSwapChecker.new(tokenWETH.address)
    })

    it('Deployed test contract "AST"', async () => {
      tokenAST = await FungibleToken.new()
    })

    it('Deployed test contract "DAI"', async () => {
      tokenDAI = await FungibleToken.new()
    })

    it('Deployed Indexer token with AST as staking and AST/DAI index created', async () => {
      indexer = await Indexer.new(tokenAST.address)
      await indexer.createIndex(tokenAST.address, tokenDAI.address, PROTOCOL)
    })

    it('Deployed Delegate for Alice address AST indexer', async () => {
      aliceDelegate = await Delegate.new(
        swapAddress,
        indexer.address,
        aliceAddress,
        aliceTradeWallet,
        PROTOCOL
      )
    })
  })

  describe('Minting...', async () => {
    it('Mints 1000 AST for Alice', async () => {
      emitted(await tokenAST.mint(aliceTradeWallet, 1000), 'Transfer')
      ok(
        await balances(aliceTradeWallet, [
          [tokenAST, 1000],
          [tokenDAI, 0],
        ]),
        'Alice balances are incorrect'
      )
    })

    it('Mints 1000 DAI for Bob', async () => {
      emitted(await tokenDAI.mint(bobAddress, 1000), 'Transfer')
      ok(
        await balances(bobAddress, [
          [tokenAST, 0],
          [tokenDAI, 1000],
        ]),
        'Bob balances are incorrect'
      )
    })
  })

  describe('Approving...', async () => {
    it('Checks approvals (Alice 250 AST and 0 DAI, Bob 0 AST and 500 DAI)', async () => {
      emitted(
        await tokenAST.approve(swapAddress, 400, { from: aliceTradeWallet }),
        'Approval'
      )
      emitted(
        await tokenDAI.approve(swapAddress, 1000, { from: bobAddress }),
        'Approval'
      )
      ok(
        await allowances(aliceTradeWallet, swapAddress, [
          [tokenAST, 400],
          [tokenDAI, 0],
        ])
      )
      ok(
        await allowances(bobAddress, swapAddress, [
          [tokenAST, 0],
          [tokenDAI, 1000],
        ])
      )
    })
  })

  describe('Delegate Swaps interacting with Alice Delegate', async () => {
    let order

    before('Alice creates an order for Bob (200 AST for 50 DAI)', async () => {
      order = await orders.getOrder({
        sender: {
          wallet: aliceTradeWallet,
          token: tokenAST.address,
          amount: 200,
        },
        signer: {
          wallet: bobAddress,
          token: tokenDAI.address,
          amount: 50,
        },
      })

      order.signature = await signatures.getWeb3Signature(
        order,
        bobAddress,
        swapAddress,
        GANACHE_PROVIDER
      )
    })

    it('Checks fillable swap order to delegate without a rule', async () => {
      const checkerOutput = await preSwapChecker.checkSwapDelegate.call(
        order,
        aliceDelegate.address,
        {
          from: bobAddress,
        }
      )
      equal(web3.utils.toUtf8(checkerOutput[1][0]), 'TOKEN_PAIR_INACTIVE')
      equal(web3.utils.toUtf8(checkerOutput[1][1]), 'ORDER_AMOUNT_EXCEEDS_MAX')
      equal(web3.utils.toUtf8(checkerOutput[1][2]), 'DELEGATE_UNABLE_TO_PRICE')
      equal(web3.utils.toUtf8(checkerOutput[1][3]), 'SENDER_UNAUTHORIZED')
      equal(checkerOutput[0], 4)
    })

    it('Checks maximum delegate error generation for swap delegate', async () => {
      const selfOrder = await orders.getOrder({
        signer: {
          wallet: aliceAddress,
          token: tokenAST.address,
          amount: 200,
          kind: UNKNOWN_KIND,
        },
        sender: {
          wallet: bobAddress,
          token: tokenAST.address,
          amount: 50,
          kind: UNKNOWN_KIND,
        },
      })

      errorCodes = await preSwapChecker.checkSwapDelegate.call(
        selfOrder,
        aliceDelegate.address,
        {
          from: bobAddress,
        }
      )
      equal(errorCodes[0].toNumber(), 11)
      equal(web3.utils.toUtf8(errorCodes[1][0]), 'SENDER_TOKEN_KIND_UNKNOWN')
      equal(web3.utils.toUtf8(errorCodes[1][1]), 'SIGNER_TOKEN_KIND_UNKNOWN')
      equal(web3.utils.toUtf8(errorCodes[1][2]), 'SIGNER_UNAUTHORIZED')
      equal(web3.utils.toUtf8(errorCodes[1][3]), 'SIGNATURE_MUST_BE_SENT')
      equal(web3.utils.toUtf8(errorCodes[1][4]), 'SENDER_WALLET_INVALID')
      equal(web3.utils.toUtf8(errorCodes[1][5]), 'SIGNER_KIND_MUST_BE_ERC20')
      equal(web3.utils.toUtf8(errorCodes[1][6]), 'SENDER_KIND_MUST_BE_ERC20')
      equal(web3.utils.toUtf8(errorCodes[1][7]), 'TOKEN_PAIR_INACTIVE')
      equal(web3.utils.toUtf8(errorCodes[1][8]), 'ORDER_AMOUNT_EXCEEDS_MAX')
      equal(web3.utils.toUtf8(errorCodes[1][9]), 'DELEGATE_UNABLE_TO_PRICE')
      equal(web3.utils.toUtf8(errorCodes[1][10]), 'SENDER_UNAUTHORIZED')
    })

    it('Create a rule and ensure appropriate approvals gets zero error codes', async () => {
      const order = await orders.getOrder({
        sender: {
          wallet: aliceTradeWallet,
          token: tokenAST.address,
          amount: 200,
        },
        signer: {
          wallet: bobAddress,
          token: tokenDAI.address,
          amount: 50,
        },
      })

      order.signature = await signatures.getWeb3Signature(
        order,
        bobAddress,
        swapAddress,
        GANACHE_PROVIDER
      )

      // create a rule for AST/DAI for alice
      await aliceDelegate.setRule(
        tokenAST.address,
        tokenDAI.address,
        1000,
        25,
        2,
        { from: aliceAddress }
      )

      // Bob authorizes swap to send orders on his behalf
      // function also checks that msg.sender == order.sender.wallet
      await swapContract.authorizeSender(aliceDelegate.address, {
        from: aliceTradeWallet,
      })

      errorCodes = await preSwapChecker.checkSwapDelegate.call(
        order,
        aliceDelegate.address,
        {
          from: bobAddress,
        }
      )
      equal(errorCodes[0], 0)
      // ensure that the order then succeeds
      emitted(
        await aliceDelegate.provideOrder(order, { from: bobAddress }),
        'ProvideOrder'
      )
    })

    it('Create a rule and ensure appropriate approvals but put in an invalid price', async () => {
      const order = await orders.getOrder({
        sender: {
          wallet: aliceTradeWallet,
          token: tokenAST.address,
          amount: 200,
        },
        signer: {
          wallet: bobAddress,
          token: tokenDAI.address,
          amount: 5,
        },
      })

      order.signature = await signatures.getWeb3Signature(
        order,
        bobAddress,
        swapAddress,
        GANACHE_PROVIDER
      )

      // // create a rule for AST/DAI for alice
      // await aliceDelegate.setRule(
      //   tokenAST.address,
      //   tokenDAI.address,
      //   1000,
      //   25,
      //   2,
      //   { from: aliceAddress }
      // )

      // Bob authorizes swap to send orders on his behalf
      // function also checks that msg.sender == order.sender.wallet
      await swapContract.authorizeSender(aliceDelegate.address, {
        from: aliceTradeWallet,
      })

      errorCodes = await preSwapChecker.checkSwapDelegate.call(
        order,
        aliceDelegate.address,
        {
          from: bobAddress,
        }
      )
      equal(errorCodes[0], 1)
      equal(web3.utils.toUtf8(errorCodes[1][0]), 'PRICE_INVALID')
      // ensure that the order then succeeds
      await reverted(
        aliceDelegate.provideOrder(order, { from: bobAddress }),
        'PRICE_INVALID'
      )
    })
  })
})
