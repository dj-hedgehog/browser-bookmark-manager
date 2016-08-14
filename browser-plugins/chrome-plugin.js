'use strict'

import childProc from 'child_process'
import fs from 'fs'
import os from 'os'

import BrowserPlugin from './browser-plugin'

class ChromePlugin extends BrowserPlugin {

  /**
   * Determines the location of the file containing the bookmarks
   * @param  {[type]} profile [description]
   * @return {[type]}         [description]
   */
  static getBookmarkLocation (profile) {
    // Determine Chrome config location
    if (os.type() === 'Darwin') {
      return `${os.homedir()}/Library/Application Support/Google/Chrome/${profile}/Bookmarks`
    } else if (os.type() === 'Windows_NT') {
      // TODO Append the real value
      return `${os.homedir()}`
    }
  }

  getBookmarks (profile) {
    // Yes we can use synchronous code here because the file needs to be loaded before something will happen anyways
    let data
    try {
      data = fs.readFileSync(ChromePlugin.getBookmarkLocation(profile), 'utf8')
    } catch (err) {
      throw new Error(`There is no profile '${profile}'`)
    }
    const obj = JSON.parse(data)

    let it
    let res
    let bookmarkItems = []

    // Traverse all roots keys
    for (let key in obj.roots) {
      it = traverseTree(obj.roots[key])

      res = it.next()
      while (!res.done) {
        if (res.value.type === 'url') {
          bookmarkItems.push({
            name: res.value.name,
            value: res.value.url
          })
        }
        res = it.next()
      }
    }
    return bookmarkItems
  }

  open (url) {
    childProc.exec(`open -a "Google Chrome" "${url}"`)
  }
}

function * traverseTree (data) {
  if (!data) {
    return
  }

  if (data.children) {
    yield * traverseTree(data.children)
  }

  for (var i = 0; i < data.length; i++) {
    var val = data[i]
    yield val

    if (val.children) {
      yield * traverseTree(val.children)
    }
  }
}

export default ChromePlugin
