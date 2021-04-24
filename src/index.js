require('babel-polyfill')
import express from 'express'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import cors from "cors"
import natsServer from 'nats'
import Hemera from 'nats-hemera'

import graphqlHTTP from "express-graphql"
import { makeExecutableSchema } from "graphql-tools"

import { typeDefs, root as resolvers } from './graph'

const app = express()

const { PORT = 8080, NATS_URL } = process.env

const nats = natsServer.connect({
  url: NATS_URL,
})

const hemera = new Hemera(nats, {
  logLevel: 'silent',
})

const schema = makeExecutableSchema({ typeDefs, resolvers })

hemera.ready(() => {
  app.use(cors())
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(bodyParser.json('application/json'))
  app.use(cookieParser())

  app.post('/api/admin/register', async (req, res) => {
    const { churchName, name, contact, password } = req.body


    const { data: { token }} = await hemera.act({
      topic: 'auth-service',
      cmd: 'create-admin',
      name,
      contact,
      churchName,
      password
    })

    res.cookie('token', token)
    res.json({ token })
  })

  app.post('/api/admin/login', async (req, res) => {
    const { contact, password } = req.body

    const { data: { token, ok, message }} = await hemera.act({
      topic: 'auth-service',
      cmd: 'login-admin',
      contact,
      password
    })

    if(ok){
      res.cookie('token', token)
      res.json({ ok, token })
    } else {
      res.json({ ok, message })
    }
  })

  const auth = async (req, res, next) => {
    let token = req.headers['x-access-token'] || req.headers['authorization'] // Express headers are auto converted to lowercase
    if(!token) return res.json({ ok: false, message: "Not Authenticated" })

    if (token.startsWith('Bearer ')) {
      // Remove Bearer from string
      token = token.slice(7, token.length);
    }
    
    const { data: user } = await hemera.act({
      topic:'auth-service',
      cmd:'verify-jwt',
      token
    })

    req.user = user
    next()
  }

  const context = async ({ req, res }) => {
    return {
      hemera,
      user: req.user,
      church: req.user.church,
      res
    }
  }

  app.use("/api/su", async (req, res, next) => {
      return graphqlHTTP({
        schema,
        graphiql: true,
        // context: await context({ req, res })
      })(req, res, next)
    }
  )

  app.listen(PORT, () => console.log(`[MINISTER]: 🚀 Superuser API Server ready at :${PORT}`))
})
