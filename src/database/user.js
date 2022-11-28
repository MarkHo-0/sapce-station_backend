import { Pool } from 'mysql2'
    
export class User{

  /** @type {Pool} @private */
  db = null

  constructor(db) {
    this.db = db
  }
  
  async getByLoginToken(token) {
    const [_, fields] = await this.db.promise().execute(`SELECT * FROM user_login_state WHERE token=?`, [token])

    if (fields.length == 0) {
      throw new Error('Token Invalid')
    }

    //TODO: 待完善令牌獲取用戶資料過程
    return true
  }

}

async function getUserByUid(uid){
  const [_, fields] = await this.db.promise().execute(`--sql
    SELECT * FROM user_info WHERE uid =?`,
    [uid]
    )
  }


function getUserVerificationData(sid){
  con.query("SELECT * FROM user_vf WHERE vf_code = " + sid)
}

function hasUidAndPassword(uid, pwd){
  con.query("SELECT uid FROM user_pwd WHERE uid = " + uid + " AND hashed_pwd = " + pwd)
}

async function getBanedUser(uid){
  const [_, fields] = await this.db.promise().execute(`--sql
  SELECT * FROM users_baned WHERE uid= ?`,
  [uid]
  )
}
