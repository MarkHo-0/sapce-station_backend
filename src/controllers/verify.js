import { validateSID, validateVerificationCode } from '../utils/dataValidation.js'
import { sendVfEmail } from '../utils/emailService.js'

const VF_CODE_VALID_MINUTES = 1

/** @typedef {import('../types/express.js').RouteFunction} RouteFunction */

/** @type {RouteFunction} */
export async function sendVfCode(req, res) {
  //檢查學生編號是否合法
  const sid = validateSID(req.body['sid'])
  if (!sid) return res.status(400).send({ reason_id: VF_ERROR.INVALID_SID })

  //獲取該學生的過往驗證資料，如從未驗證過則會跳過下方if
  const oldVfData = await req.db.user.getVerificationData(sid)
  if (oldVfData)  {

    //檢查是否已是驗證過的用戶
    if (oldVfData.used) {
      return res.status(400).send({ reason_id: VF_ERROR.VERIFIED })
    }

    //檢查上次的驗證碼是否過期
    if (!oldVfData.expired) {
      return res.status(400).send({ reason_id: VF_ERROR.TOO_FREQ })
    }

    //刪除已過期的驗證碼
    await req.db.user.removeVerificationData(sid)
  }

  //生成隨機驗證碼
  const vf_code = generateVerificationCode()

  try {
    //發送驗證電郵以及寫入資料庫
    sendVfEmail(sid, vf_code)
    await req.db.user.createVerificationData(sid, vf_code, VF_CODE_VALID_MINUTES)
    res.send()
  } catch (error) {
    //發生未知錯誤
    res.status(400).send({ reason_id: VF_ERROR.UNKNOWN })
  }
}

/** @type {RouteFunction} */
export async function checkVfCode(req, res) {
  //檢查學生編號和驗證編號是否合法
  const sid = validateSID(req.body['sid'])
  const vf_code = validateVerificationCode(req.body['vf_code'])
  if (!sid || !vf_code) return res.status(400).send()

  //獲取該學生編號的過往驗證資料
  const oldVfData = await req.db.user.getVerificationData(sid)

  //檢查驗證碼，包括是否已經使用、是否過期
  if ( !oldVfData || oldVfData.used || oldVfData.expired || oldVfData.vf_code != vf_code) {
    return res.status(400).send()
  }

  //核對成功，標記為已驗證
  req.db.user.setVerified(sid)
  res.send()
}

function generateVerificationCode() {
  return Math.floor(1000 + Math.random() * 9000)
}

/** @readonly @enum {number} */
const VF_ERROR = {
  UNKNOWN: 0,
  INVALID_SID: 1,
  VERIFIED: 2,
  TOO_FREQ: 3
}