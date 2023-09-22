/*
 * @Author: asong
 * @Date: 2023-09-22 10:43:29
 * @LastEditTime: 2023-09-22 14:34:29
 * @FilePath: /wechaty/examples/cron/cron.setting.ts
 * @Description:
 */
export const cronSetting = {
  recruitment:[ {
    cron:'0 0 8 * * *',
    randomTime:3600000,
  }, {
    cron:'0 0 18 * * *',
    randomTime:7200000,
  } ],
}
