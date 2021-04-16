require("babel-polyfill")
import "graphql-import-node"
import { importSchema } from 'graphql-import'

import { Query, nested } from './queries'
import Mutation from './mutations'

const typeDefs = importSchema("./schema.graphql")

const root = {
  Query,
  Mutation
}

Object.assign(root, nested)

export {
  typeDefs,
  root
}
