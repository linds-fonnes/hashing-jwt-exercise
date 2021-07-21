/** User class for message.ly */

const db = require("../db");
const ExpressError = require("../expressError");
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../config");

/** User of the site. */

class User {
  
  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({username, password, first_name, last_name, phone}) { 
    const hashed_password = await bcrypt.hash(password, BCRYPT_WORK_FACTOR)
    const result = await db.query(`INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at) VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp) RETURNING username, password, first_name, last_name, phone`,[username, hashed_password, first_name, last_name, phone]);

    return result.rows[0];
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) { 
    const result = await db.query(`SELECT password FROM users WHERE username = $1`, [username]);
    const user = result.rows[0];
    return(user && bcrypt.compare(password, user.password))
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    const result = await db.query(`UPDATE users 
    SET last_login_at = current_timestamp 
    WHERE username = $1 
    RETURNING username`,
     [username]);

    if(!result.rows[0]){
      throw new ExpressError(`No such user: ${username}`, 404)
    }

    return result.rows[0];
   }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {
    const result = await db.query(`SELECT username, first_name, last_name, phone FROM users`);
    return result.rows;
   }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) { 
    const result = await db.query(`SELECT username, first_name, last_name, phone, join_at, last_login_at FROM users WHERE username = $1`, [username]);
    return result.rows[0]
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const result = await db.query(`SELECT m.body, 
    m.id, 
    m.read_at, 
    m.sent_at, 
    u.first_name, 
    u.last_name, 
    u.phone, 
    u.username 
    FROM messages as m
    JOIN users as u ON m.to_username = u.username
    WHERE m.from_username = $1`
    ,[username])
    

    if (!result){
      throw new ExpressError(`No such user: ${username}`, 404);
    }

    return result.rows.map(m => ({
      body: m.body,
      id: m.id,
      read_at: m.read_at,
      sent_at: m.sent_at,
      to_user: {
        first_name: m.first_name,
        last_name: m.last_name,
        phone: m.phone,
        username: m.username
      }
    }))
   }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const result = await db.query(`SELECT m.body, 
    m.id, 
    m.read_at, 
    m.sent_at, 
    u.first_name, 
    u.last_name, 
    u.phone, 
    u.username 
    FROM messages as m
    JOIN users as u ON m.from_username = u.username
    WHERE m.to_username = $1`
    ,[username])
    

    if (!result){
      throw new ExpressError(`No such user: ${username}`, 404);
    }

    return result.rows.map(m => ({
      body: m.body,
      id: m.id,
      read_at: m.read_at,
      sent_at: m.sent_at,
      from_user: {
        first_name: m.first_name,
        last_name: m.last_name,
        phone: m.phone,
        username: m.username
      }
    }))
   }
}


module.exports = User;