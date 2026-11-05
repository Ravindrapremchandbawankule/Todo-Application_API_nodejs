const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'todoApplication.db')
let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    await db.run(`
      CREATE TABLE IF NOT EXISTS todo (
        id INTEGER PRIMARY KEY,
        todo TEXT,
        priority TEXT,
        status TEXT
      );
    `)

    app.listen(3000, () => {
      console.log('Server running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

// API 1 - GET /todos/
app.get('/todos/', async (request, response) => {
  const {status, priority, search_q} = request.query

  let getTodosQuery = ''

  const hasStatus = status !== undefined
  const hasPriority = priority !== undefined
  const hasSearch = search_q !== undefined

  if (hasPriority && hasStatus) {
    getTodosQuery = `
      SELECT * FROM todo
      WHERE priority = '${priority}'
        AND status = '${status}';
    `
  } else if (hasStatus) {
    getTodosQuery = `
      SELECT * FROM todo
      WHERE status = '${status}';
    `
  } else if (hasPriority) {
    getTodosQuery = `
      SELECT * FROM todo
      WHERE priority = '${priority}';
    `
  } else if (hasSearch) {
    getTodosQuery = `
      SELECT * FROM todo
      WHERE todo LIKE '%${search_q}%';
    `
  } else {
    getTodosQuery = `SELECT * FROM todo;`
  }

  const todos = await db.all(getTodosQuery)
  response.send(todos)
})

// API 2 - GET /todos/:todoId/
app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`
  const todo = await db.get(getTodoQuery)
  response.send(todo)
})

// API 3 - POST /todos/
app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status} = request.body
  const addTodoQuery = `
    INSERT INTO todo (id, todo, priority, status)
    VALUES (${id}, '${todo}', '${priority}', '${status}');
  `
  await db.run(addTodoQuery)
  response.send('Todo Successfully Added')
})

// API 4 - PUT /todos/:todoId/
app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const {status, priority, todo} = request.body

  let updatedColumn = ''
  let updateTodoQuery = ''

  const hasStatus = status !== undefined
  const hasPriority = priority !== undefined
  const hasTodo = todo !== undefined

  if (hasStatus) {
    updatedColumn = 'Status'
    updateTodoQuery = `
      UPDATE todo SET status = '${status}'
      WHERE id = ${todoId};
    `
  } else if (hasPriority) {
    updatedColumn = 'Priority'
    updateTodoQuery = `
      UPDATE todo SET priority = '${priority}'
      WHERE id = ${todoId};
    `
  } else if (hasTodo) {
    updatedColumn = 'Todo'
    updateTodoQuery = `
      UPDATE todo SET todo = '${todo}'
      WHERE id = ${todoId};
    `
  }

  await db.run(updateTodoQuery)
  response.send(`${updatedColumn} Updated`)
})

// API 5 - DELETE /todos/:todoId/
app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteTodoQuery = `DELETE FROM todo WHERE id = ${todoId};`
  await db.run(deleteTodoQuery)
  response.send('Todo Deleted')
})

module.exports = app
