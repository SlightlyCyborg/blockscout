import $ from 'jquery'
import { createStore, connectElements } from '../lib/redux_helpers.js'
import Web3 from 'web3'

export const initialState = {
  web3: null,
  account: null
}

export function reducer (state = initialState, action) {
  switch (action.type) {
    case 'WEB3_DETECTED': {
      const $el = $('[data-page="stakes"]')
      const validatorsContract = new action.web3.eth.Contract($el.data('validators-abi'), $el.data('validators-address'))
      const stakingContract = new action.web3.eth.Contract($el.data('staking-abi'), $el.data('staking-address'))
      return Object.assign({}, state, {
        web3: action.web3,
        validatorsContract: validatorsContract,
        stakingContract: stakingContract
      })
    }
    case 'AUTHORIZED': {
      var sessionUserAddress = $('[data-page="stakes"]').data('user-address') || null
      if (!(sessionUserAddress === action.account)) {
        $.getJSON(state.accountPath, {command: 'set_session', address: action.account})
          .done(response => {
            if (response.reload === true) {
              document.location.reload()
            }
          })
      }
      return Object.assign({}, state, { account: action.account })
    }
    default:
      return state
  }
}

const elements = {
  '[data-selector="login-button"]': {
    load ($el) {
      $el[0].addEventListener('click', redirectToMetamask)
    },
    render ($el, state, oldState) {
      if (oldState.web3 === state.web3) return
      if (state.web3) {
        $el[0].removeEventListener('click', redirectToMetamask)
        $el[0].addEventListener('click', async () => {
          try {
            await window.ethereum.enable()
            const accounts = await state.web3.eth.getAccounts()

            const defaultAccount = accounts[0] || null
            store.dispatch({ type: 'AUTHORIZED', account: defaultAccount })
          } catch (e) {
            console.log(e)
            console.error('User denied account access')
          }
        })
      }
    }
  },
  '[data-async-load]': {
    load ($el) {
      return {
        accountPath: $el.data('async-listing')
      }
    }
  }
}

export var store

const $stakesPage = $('[data-page="stakes"]')
if ($stakesPage.length) {
  store = createStore(reducer)
  connectElements({ store, elements })

  getWeb3(store)
}

function getWeb3 (store) {
  if (window.ethereum) {
    let web3 = new Web3(window.ethereum)
    console.log('Injected web3 detected.')
    web3.eth.getAccounts()
      .then(accounts => {
        var defaultAccount = accounts[0] || null
        store.dispatch({ type: 'AUTHORIZED', account: defaultAccount })
      })

    store.dispatch({ type: 'WEB3_DETECTED', web3: web3 })
  }
}

function redirectToMetamask () {
  var win = window.open('https://metamask.io', '_blank')
  win.focus()
}
