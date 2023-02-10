import { ClassSwapRequest } from '../models/class_swap_request.js'

export class ClassSwap {

  constructor(connection) {
    /** @type {import('mysql2/promise').Pool} @private */
    this.db = connection
  }   

  async getRequest(id) {
    if(typeof id != 'number') return null

    const [sReqs, _] = await this.db.execute ("SELECT * FROM class_swap_requests WHERE `id` = ?", [id])

    if (sReqs.length != 1) return null

    return ClassSwapRequest.fromDB(sReqs[0]);
  }

  async hasRequestBy(user, course_code) {
    const [sReqs, _] = await this.db.execute(
      "SELECT `id` FROM  class_swap_requests WHERE `requester` = ? AND `course_code` = ? ",
      [user, course_code]
    )
    return sReqs.length > 0
  }

  async createRequest(course_code, curr_class, exp_class, user, contact) {
    await this.db.execute (
      "INSERT INTO class_swap_requests (`course_code`, `current_class`, `expected_class`, `requester`, `contact_method`, `contact_detail`) VALUE (?, ?, ?, ?, ?, ?)", 
      [course_code, curr_class, exp_class, user.uid, contact.method, contact.detail]
    )
    return true
  }

  async querySwappableRequests(course_code, curr_class) {
    const [sReqs, _] = await this.db.execute(
      "SELECT r1.* FROM class_swap_requests AS r1 RIGHT JOIN (SELECT ANY_VALUE(`id`) AS `id`, MIN(`request_on`) FROM class_swap_requests WHERE `course_code` = ? AND `expected_class` = ?  AND `responser_uid` IS NULL GROUP BY `current_class`) AS r2 ON r1.id = r2.id ORDER BY `current_class`",
      [course_code, curr_class]
    )
    return sReqs.map( r => ClassSwapRequest.fromDB(r).toJSON())
  }

  async setResponser(id, user) {
    await this.db.execute ("UPDATE class_swap_requests SET `responser_uid` = ?, `response_on` = NOW() WHERE `id` = ?", [user.uid, id])
    return true
  }

  async removeRequest(id){
    await this.db.execute ("DELETE FROM class_swap_requests WHERE `id` = ?", [id])
    return true
  }
}
