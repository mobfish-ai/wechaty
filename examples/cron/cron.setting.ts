/*
 * @Author: asong
 * @Date: 2023-09-22 10:43:29
 * @LastEditTime: 2023-10-23 14:50:28
 * @FilePath: /wechaty/examples/cron/cron.setting.ts
 * @Description:
 */
export const cronSetting = {
  recruitment:[ {
    cron:'0 0 8 * * *',
    randomTime:3600000,
    msgs:[{
      type:"text",
      path:"/examples/cron/message1.txt"
    }]
  },{
    cron:'0 0 9 * * *',
    randomTime:3600000,
    msgs:[{
      type:"text",
      path:"/examples/cron/message2.txt"
    },{
      type:"file",
      path:"/examples/cron/qrCode.png"
    }]
  }, {
    cron:'0 0 18 * * *',
    randomTime:7200000,
    msgs:[{
      type:"text",
      path:"/examples/cron/message1.txt"
    }]
  }, {
    cron:'0 0 19 * * *',
    randomTime:7200000,
    msgs:[{
      type:"text",
      path:"/examples/cron/message2.txt"
    },{
      type:"file",
      path:"/examples/cron/qrCode.png"
    }]
  } ],
}
