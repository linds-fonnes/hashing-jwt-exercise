const request = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("../app");
const db = require("../db");
const User = require("../models/user");
const Message = require("../models/message");
const { SECRET_KEY } = require("../config");


describe("Messages routes testing", function (){
    let token;
    beforeEach(async function () {
        await db.query("DELETE FROM messages");
        await db.query("DELETE FROM users");
        await db.query("ALTER SEQUENCE messages_id_seq RESTART WITH 1");

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
        
        let u3 = await User.register({
              username: "test3",
              password: "password",
              first_name: "Test3",
              last_name: "Testy3",
              phone: "+1415550002"
          })
    
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

       let m3 = await Message.create({
            from_username: "test2",
            to_username: "test3",
            body: "test2 user to test3 user"
        })
        token = jwt.sign({username: "test1"}, SECRET_KEY)
        
      });

      describe("GET /messages/:id", function() {
        test("retrieves individual message data", async function () {
            let response = await request(app).get(`/messages/1`).send({_token: token});
            expect(response.statusCode).toBe(200)
        })

        test("error message received for invalid message id", async function () {
            let response = await request(app).get("/messages/9999").send({_token: token});
            expect(response.statusCode).toBe(404)
        })

        test("error message if curr user is not msg recipient or sender", async function () {
            let response = await request(app).get("/messages/3").send({_token: token});
            expect(response.statusCode).toBe(401)
        })
    })

    describe("POST /messages", function () {
        test("creates a new message and returns message data", async function () {
            let response = await request(app).post("/messages").send({to_username: "test2", body: "testing", _token: token});
            expect(response.statusCode).toBe(200)
            expect(response.body).toEqual({new_message: {
                body: "testing",
                from_username: "test1",
                id: expect.any(Number),
                sent_at: expect.any(String),
                to_username: "test2"
            }})
        })

        test("cannot send message to nonexistent username", async function () {
            let response = await request(app).post("/messages").send({to_username: "test999", body:"testing", _token: token});
            expect(response.statusCode).toBe(500)
        })
    })
    
    describe("POST /messages/:id/read", function() {

        test("allows user to mark their own message as read", async function () {
            let response = await request(app).post("/messages/2/read").send({_token: token});
            expect(response.body).toEqual({
                read_msg: {
                    id:2,
                    read_at: expect.any(String)
                }
            })
        })

        test("cannot mark a nonexistent msg id as read", async function () {
            let response = await request(app).post("/messages/000/read").send({_token: token});
            expect(response.statusCode).toBe(404)
        })

        test("cannot mark other user's messages as read", async function () {
            let response = await request(app).post("/messages/1/read").send({_token: token});
            expect(response.statusCode).toBe(401)
        })
    })


    afterAll(async function () {
        await db.end();
})
})