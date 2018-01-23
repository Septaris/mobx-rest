// @flow
import { action, observable, IObservableArray } from 'mobx'
import apiClient from './apiClient'
import Request from './Request'

export default class Base {
  @observable.shallow requests: IObservableArray = []

  /**
   * Returns the resource's url.
   *
   * @abstract
   */
  url (): string {
    throw new Error('You must implement this method')
  }

  withRequest (labels: string | Array<string>, promise: Promise<*>, abort?: () => void): Request {
    if (typeof labels === 'string') {
      labels = [labels]
    }

    const request = new Request({
      labels,
      promise: new Promise((resolve, reject) => {
        promise
          .then(response => {
            this.requests.remove(request)
            return response
          })
          .then(resolve)
          .catch(error => {
            this.requests.remove(request)
            throw error
          })
          .catch(reject)
      }),
      abort
    })

    this.requests.push(request)

    return request
  }

  getRequest (label: string): ?Request {
    return this.requests.find(request => request.labels.indexOf(label) !== -1)
  }

  getAllRequests (label: string): Array<Request> {
    return this.requests.filter(request => request.labels.indexOf(label) !== -1)
  }

  /**
   * Questions whether the request exists
   * and matches a certain label
   */
  isRequest (label: string): boolean {
    return !!this.getRequest(label)
  }

  /**
   * Call an RPC action for all those
   * non-REST endpoints that you may have in
   * your API.
   */
  @action
  rpc (label: string, endpoint: string, options?: {}): Promise<*> {
    const { promise, abort } = apiClient().post(`${this.url()}/${endpoint}`, options)

    return this.withRequest(label, promise, abort)
  }
}
