const request = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("../app");
const db = require("../db");
const User = require("../models/user");
const Message = require("../models/message");
const { SECRET_KEY } = require("../config");

describe("Users routes testing", function () {
let token;
beforeEach(async function () {
    await db.query("DELETE FROM messages");
    await db.query("DELETE FROM users");

    let u1 = await User.register({
        username: "test1",
        password: "password",
        first_name: "Test1",
        last_name: "Testy1",
        phone: "+14155550000",
      });

    let u2 = await User.register({
        username: "test2",
        password: "password",
        first_name: "Test2",
        last_name: "Testy2",
        phone: "+14155550001",
      });  

    let m1 = await Message.create({
        from_username: "test1",
        to_username: "test2",
        body: "test1 user to test2 user"
    })

   let m2 = await Message.create({
        from_username: "test2",
        to_username: "test1",
        body: "test2 user to test1 user"
    })
      token = jwt.sign({username: "test1"}, SECRET_KEY)
})


describe("GET /users", function () {
    test("retrieves list of all users", async function () {
        let response = await request(app).get("/users").send({_token: token});
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            users: [{
                first_name: "Test1",
                last_name: "Testy1",
                phone: "+14155550000",
                username: "test1",
            },
            {
                username: "test2",
                first_name: "Test2",
                last_name: "Testy2",
                phone: "+14155550001",
              }
        ]
        })
    })
})

describe("GET /users/:username", function () {
    test("retrieves detail of a user", async function () {
        let response = await request(app).get("/users/test1").send({_token: token});
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            user: {
                first_name: "Test1",
                join_at : expect.any(String),
                last_login_at: expect.any(String),
                last_name: "Testy1",
                phone:"+14155550000",
                username: "test1"
            }
        })
    })

    test("returns error if nonexistent user", async function () {
        let response = await request(app).get("/users/test000").send({_token: token});
        expect(response.statusCode).toBe(401)
    })

    test("returns error if trying to access other user's detail", async function () {
        let response = await request(app).get("/users/test2").send({_token:token}); 
        expect(response.statusCode).toBe(401)
    })

    describe("GET /users/:username/to", function () {
        test("retrieves messages for user", async function () {
            let response = await request(app).get("/users/test1/to").send({_token: token});
            expect(response.statusCode).toBe(200)
            expect(response.body).toEqual({messages: [
                {
                    body: "test2 user to test1 user",
                    from_user: {
                        first_name: "Test2",
                        last_name: "Testy2",
                        phone: "+14155550001",
                        username: "test2"
                    },
                    id: expect.any(Number),
                    read_at: null,
                    sent_at: expect.any(String)
                }
            ]})
        })

        test("returns error for non-existent user", async function () {
            let response = await request(app).get("/users/test000/to").send({_token: token});
            expect(response.statusCode).toBe(401)
        })
    
        test("returns error for retrieving messages that arent curr users", async function () {
            let response = await request(app).get("/users/test2/to").send({_token: token});
            expect(response.statusCode).toBe(401)
        })

    })

    describe("GET /users/:username/from", function () {
        test("retrieves messages from user", async function () {
            let response = await request(app).get("/users/test1/from").send({_token: token});
            expect(response.statusCode).toBe(200)
            expect(response.body).toEqual({messages: [
                {
                    body: "test1 user to test2 user",
                    to_user: {
                        first_name: "Test2",
                        last_name: "Testy2",
                        phone: "+14155550001",
                        username: "test2"
                    },
                    id: expect.any(Number),
                    read_at: null,
                    sent_at: expect.any(String)
                }
            ]})
        })
        
        test("returns error for non-existent user", async function () {
            let response = await request(app).get("/users/test000/to").send({_token: token});
            expect(response.statusCode).toBe(401)
        })
    
        test("returns error for retrieving messages that arent curr users", async function () {
            let response = await request(app).get("/users/test2/from").send({_token: token});
            expect(response.statusCode).toBe(401)
        })

    })
})

afterAll(async function () {
    await db.end();
})


})