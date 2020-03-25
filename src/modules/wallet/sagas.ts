import { put, call, all, takeEvery } from 'redux-saga/effects'
import { isMobile } from '../../lib/utils'
import {
  connectWalletSuccess,
  connectWalletFailure,
  CONNECT_WALLET_REQUEST,
  EnableWalletRequestAction,
  enableWalletFailure,
  enableWalletSuccess,
  EnableWalletSuccessAction,
  connectWalletRequest,
  ENABLE_WALLET_REQUEST,
  ENABLE_WALLET_SUCCESS
} from './actions'
import { getWallet } from './utils'

function* handleConnectWalletRequest() {
  try {
    // Hack for old providers and mobile providers which do not have a hack to convert send to sendAsync
    const provider = (window as any).ethereum
    if (
      isMobile() &&
      provider &&
      typeof provider.sendAsync === 'function' &&
      provider.send !== provider.sendAsync
    ) {
      provider.send = provider.sendAsync
    }

    // prevent metamask from auto refreshing the page
    if (provider) {
      provider.autoRefreshOnNetworkChange = false
    }

    const wallet = yield call(() => getWallet())
    yield put(connectWalletSuccess(wallet))
  } catch (error) {
    yield put(connectWalletFailure(error.message))
  }
}

function* handleEnableWalletRequest(_action: EnableWalletRequestAction) {
  try {
    const accounts: string[] = yield call(() => {
      const provider = (window as any).ethereum
      if (provider && provider.enable) {
        return provider.enable()
      }
      console.warn('Provider not found')
      return []
    })
    if (accounts.length === 0) {
      throw new Error('Enable did not return any accounts')
    }
    yield put(enableWalletSuccess())
  } catch (error) {
    yield put(enableWalletFailure(error.message))
  }
}

function* handleEnableWalletSuccess(_action: EnableWalletSuccessAction) {
  yield put(connectWalletRequest())
}

export function* walletSaga() {
  yield all([
    takeEvery(CONNECT_WALLET_REQUEST, handleConnectWalletRequest),
    takeEvery(ENABLE_WALLET_REQUEST, handleEnableWalletRequest),
    takeEvery(ENABLE_WALLET_SUCCESS, handleEnableWalletSuccess)
  ])
}

export function createWalletSaga(
  // @ts-ignore
  options?: { MANA_ADDRESS: string }
) {
  console.warn(
    'Deprecated notice: `createWalletSaga` has been deprecated and will be removed in future version, use `walletSaga` instead.'
  )
  return walletSaga
}
