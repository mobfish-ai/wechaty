/**
 *   Wechaty Chatbot SDK - https://github.com/wechaty/wechaty
 *
 *   @copyright 2016 Huan LI (李卓桓) <https://github.com/huan>, and
 *                   Wechaty Contributors <https://github.com/wechaty>.
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */
import {
  Contact,
  Message,
  ScanStatus,
  WechatyBuilder,
} from '../src/mods/mod.js' // from 'wechaty'

import qrTerm from 'qrcode-terminal'
import { FileBox } from 'file-box'

import mysql from 'mysql2'

import schedule from 'node-schedule'

import { readFile } from 'fs/promises'

import { cronSetting } from './cron/cron.setting.ts'
/**
 * 1. Declare your Bot!
 */
const options = {
  name: 'ding-dong-bot',
  /**
   * You can specify different puppet for different IM protocols.
   * Learn more from https://wechaty.js.org/docs/puppet-providers/
   */
  // puppet: 'wechaty-puppet-whatsapp'

  /**
   * You can use wechaty puppet provider 'wechaty-puppet-service'
   *   which can connect to Wechaty Puppet Services
   *   for using more powerful protocol.
   * Learn more about services (and TOKEN)from https://wechaty.js.org/docs/puppet-services/
   */
  // puppet: 'wechaty-puppet-service'
  // puppetOptions: {
  //   token: 'xxx',
  // }
}

export function parseMysql (str: string) {
  const u = new URL(str)
  if (u.protocol !== 'mysql:') throw new Error('Invalid protocol')
  return {
    host: u.hostname || 'localhost',
    port: parseInt(u.port || '3306'),
    user: u.username || 'root',
    password: u.password || '',
    database: u.pathname.slice(1) || 'test',
    charset: u.searchParams.get('charset') || 'utf8mb4',
  }
}

// create the connection to database
const MYSQL = process.env['MYSQL']
const conn_params = parseMysql(MYSQL)
console.log('[db env]', conn_params.host, conn_params.database)
const connection = mysql.createConnection(parseMysql(MYSQL))
// const res =  connection.query("SELECT 1");
const promisePool = connection.promise()

const [ res, fields ] = await promisePool.execute('SELECT 1')
if (res.length > 0) {
  console.log('db connected')
} else {
  console.log('db connection failed')
}
const bot = WechatyBuilder.build(options)

/**
 * 2. Register event handlers for Bot
 */
bot
  .on('logout', onLogout)
  .on('login', onLogin)
  .on('scan', onScan)
  .on('error', onError)
  .on('message', onMessage)
  /**
   * 3. Start the bot!
   */
  .start()
  .then(() => {
    const callback = function (time:number) {
      return async () => {
        const allRoomResult = await bot.Room.findAll()
        let msg = ''
        try {
          msg = await readFile(
            `${process.cwd()}/examples/cron/message.txt`,
            'utf-8',
          )
          // console.log('[ msg ] >', msg)
        } catch (error) {
          msg = ''
          console.log('[ error ] >', error)
        }
        if (msg) {
          // console.log('[ allRoomResult ] >', allRoomResult)
          allRoomResult.forEach((room) => {
            // if (room.payload.topic === 'xxxxx') {
            const randomTime = Math.random() * time
            console.log(
              `${
                Math.ceil(randomTime / 1000 / 60)
              }分钟后即将向群聊${room.payload.topic}发送招聘消息`,
            )
            setTimeout(async () => {
              await room.say(msg)
              console.log(`向群聊${room.payload.topic}发送成功`)
            }, randomTime)
            // }
          })
        } else {
          console.log('发送内容为空，请检查原因！')
        }
      }
    }
    if (cronSetting && Array.isArray(cronSetting.recruitment)) {
      cronSetting.recruitment.forEach(item => {
        generateJob(item.cron, callback(item.randomTime))
      })
    } else {
      console.log('请检查corn配置文件是否有误！')
    }
  })
  .catch(async (e) => {
    console.error('Bot start() fail:', e)
    await bot.stop()
    connection.end()
    process.exit(-1)
  })

function generateJob (cron:string, cb:Function) {
  schedule.scheduleJob(cron, cb)
}

/**
 * 4. You are all set. ;-]
 */

/**
 * 5. Define Event Handler Functions for:
 *  `scan`, `login`, `logout`, `error`, and `message`
 */
function onScan (qrcode: string, status: ScanStatus) {
  if (status === ScanStatus.Waiting || status === ScanStatus.Timeout) {
    qrTerm.generate(qrcode)

    const qrcodeImageUrl = [
      'https://wechaty.js.org/qrcode/',
      encodeURIComponent(qrcode),
    ].join('')

    console.info(
      'onScan: %s(%s) - %s',
      ScanStatus[status],
      status,
      qrcodeImageUrl,
    )
  } else {
    console.info('onScan: %s(%s)', ScanStatus[status], status)
  }

  // console.info(`[${ScanStatus[status]}(${status})] ${qrcodeImageUrl}\nScan QR Code above to log in: `)
}

function onLogin (user: Contact) {
  console.info(`${user.name()} login`)
}

function onLogout (user: Contact) {
  console.info(`${user.name()} logged out`)
}

function onError (e: Error) {
  console.error('Bot error:', e)
  // 检查当前机器人状态
  /*
  if (bot.isLoggedIn) {
    bot.say('Wechaty error: ' + e.message).catch(console.error)
  }
  */
}

// const options = {
//   protocol: 'https:',
//   hostname: 'qyapi.weixin.qq.com',
//   port: 443,
//   path: '/cgi-bin/webhook/send?key='+process.env['MESSAGE_BOT_KEY'],
//   method: 'POST',
//   headers: {
//       'Content-Type': 'application/json',
//       'Content-Length': data.length
//   }
// };

/**
 * 6. The most important handler is for:
 *    dealing with Messages.
 */

function null2Empty (val) {
  if (val === undefined || val === null) return ''
}
async function onMessage (msg: Message) {
  // console.log("msg",msg)
  const { payload } = msg
  console.log('msg.toString():', msg.toString(), 'msg type', payload.type)

  const from = msg.talker()
  const FromUserName = from.name()
  const to = msg.to()
  const room = msg.room()
  const roomId = room ? room.id : ''

  // 群聊消息
  if (payload.type === 7) {
    console.log(
      'from',
      FromUserName,
      'room#',
      room?.payload.memberIdList.length,
    )
    // console.log("msg payload",payload)

    try {
      const [ res, fields ] = await promisePool.execute(
        'insert into wx_message_logs(timestamp, MsgId, FromUserName,\
    talkerId,roomId,mentionIdList,Content,type) value(?,?,?,?,?,?,?,?)',
        [
          payload.timestamp,
          payload.id,
          FromUserName,
          payload.talkerId,
          roomId,
          JSON.stringify(payload.mentionIdList),
          payload.text,
          payload.type,
        ],
      )

      const [ res1, fields1 ] = await promisePool.execute(
        'select count(*) as count from wx_rooms where\
    roomId=?',
        [ roomId ],
      )
      if (res1[0].count <= 0) {
        await promisePool.execute(
          'insert into wx_rooms(roomId, membersList) values\
    (?,?)',
          [ roomId, JSON.stringify(room.memberList()) ],
        )
      }
      console.log(res)
    } catch (err) {
      console.log('onMessage', err)
    }
  }
  // if (msg.self()) {
  //   console.info('Message discarded because its outgoing')
  //   return
  // }

  if (msg.age() > 2 * 60) {
    console.info('Message discarded because its TOO OLD(than 2 minutes)')
    return
  }

  if (
    msg.type() !== bot.Message.Type.Text
    || !/^(ding|ping|bing|code)$/i.test(msg.text())
  ) {
    console.info(
      'Message discarded because it does not match ding/ping/bing/code',
    )
    return
  }

  /**
   * 1. reply 'dong'
   */
  await msg.say('dong')
  console.info('REPLY: dong')

  /**
   * 2. reply image(qrcode image)
   */
  const fileBox = FileBox.fromUrl(
    'https://wechaty.github.io/wechaty/images/bot-qr-code.png',
  )

  await msg.say(fileBox)
  console.info('REPLY: %s', fileBox.toString())

  /**
   * 3. reply 'scan now!'
   */
  await msg.say([
    'Join Wechaty Developers Community\n\n',
    'Scan now, because other Wechaty developers want to talk with you too!\n\n',
    '(secret code: wechaty)',
  ].join(''))
}

/**
 * 7. Output the Welcome Message
 */
const welcome = `
| __        __        _           _
| \\ \\      / /__  ___| |__   __ _| |_ _   _
|  \\ \\ /\\ / / _ \\/ __| '_ \\ / _\` | __| | | |
|   \\ V  V /  __/ (__| | | | (_| | |_| |_| |
|    \\_/\\_/ \\___|\\___|_| |_|\\__,_|\\__|\\__, |
|                                     |___/

=============== Powered by Wechaty ===============
-------- https://github.com/wechaty/wechaty --------
          Version: ${bot.version()}

I'm a bot, my superpower is talk in Wechat.

If you send me a 'ding', I will reply you a 'dong'!
__________________________________________________

Hope you like it, and you are very welcome to
upgrade me to more superpowers!

Please wait... I'm trying to login in...

`
console.info(welcome)
