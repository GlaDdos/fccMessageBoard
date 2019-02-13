const MongoCLient = require('mongodb');
const ObjectID = require('mongodb').ObjectID;

const CONNECTION_STRING = process.env.CONNECTION_STRING;
const DB_NAME = process.env.DB_NAME;
const COLLECTION = 'boards';

exports.postThread = function (req, res) {
  const boardName = req.params.board;
  const { text, delete_password } = req.body;

  const date = new Date();
  const thread = {
    _id: new ObjectID(),
    text,
    delete_password,
    created_on: date,
    bumped_on: date,
    reported: false,
    replies: []
  }

  MongoCLient.connect(CONNECTION_STRING)
    .then( database => {
      return database.db(DB_NAME).collection(COLLECTION);
    })
    .then( boardsCollection => {
      return boardsCollection.findOneAndUpdate(
        {name: boardName},
        {$push: {threads: thread}},
        {returnOriginal: false, upsert: true}
      );
    })
    .then( result => {
      res.redirect(`/b/${boardName}/`);
    })
    .catch(err => {
      console.dir(err);
      res.status(500).send('Database error');
    })
    
}

exports.postReplay = function(req, res) {
  const boardName = req.params.board;
  const { text, delete_password, thread_id } = req.body;

  const date = new Date();
  const data = {
    _id: new ObjectID(),
    text,
    created_on: date,
    delete_password,
    reported: false
  };

  MongoCLient.connect(CONNECTION_STRING)
    .then(database => {
      return database.db(DB_NAME).collection(COLLECTION);
    })
    .then( boardsCollection => {
      return boardsCollection.findOneAndUpdate(
        { name: boardName },
        { $push: { "threads.$[thread].replies": data }, $set: {'threads.$[thread].bumped_on': date}},
        { arrayFilters: [{"thread._id": new ObjectID(thread_id)}]});
    })
    .then( result => {
      res.status(200).redirect(`/b/${boardName}/${thread_id}`);
    })
    .catch(err => {
      console.dir(err);
      res.status(500).send('Database error');
    });
}

exports.reportThread = function (req, res) {
  const boardName = req.params.board;
  const thread_id = req.body.thread_id;

  MongoCLient.connect(CONNECTION_STRING)
    .then( database => {
      return database.db(DB_NAME).collection(COLLECTION);
    })
    .then ( boardsCollection => {
      return boardsCollection.findOneAndUpdate(
        { name: boardName },
        { $set: { 'threads.$[thread].reported': true} },
        { arrayFilters: [{'thread._id': new ObjectID(thread_id)}]});
    })
    .then( result => {
      res.status(200).send('success');
    })
    .catch( err => {
      console.dir(err);
      res.status(500).send('database error');
    }) 
}

exports.reportReply = function (req, res) {
  const boardName = req.params.board;
  const { thread_id, reply_id } = req.body;

  MongoCLient.connect(CONNECTION_STRING)
    .then( database => {
      return database.db(DB_NAME).collection(COLLECTION);
    })
    .then( boardsCollection => {
      return boardsCollection.findOneAndUpdate(
        { name: boardName },
        { $set: {'threads.$[thread].replies.$[reply].reported': true }},
        { arrayFilters: [{'thread._id': new ObjectID(thread_id)}, {'reply._id': new ObjectID(reply_id)}] });
    })
    .then( result => {
      res.status(200).send('success');
    })
    .catch( err => {
      console.dir(err);
      res.status(500).send('database error');
    });
}

exports.deleteReply = function(req, res) {
  const boardName = req.params.board;
  const { thread_id, reply_id, delete_password } = req.body;

  MongoCLient.connect(CONNECTION_STRING)
    .then( database => {
      return database.db(DB_NAME).collection(COLLECTION);
    })
    .then( boardsCollection => {
      return boardsCollection.findOneAndUpdate(
        { name: boardName,
          threads: { 
            $elemMatch: { _id: new ObjectID(thread_id), 
              replies: { 
                $elemMatch: { _id: new ObjectID(reply_id), delete_password: delete_password}}   }} },
        { $set: {'threads.$[thread].replies.$[reply].text': '[deleted]' }},
        { arrayFilters: [{'thread._id': new ObjectID(thread_id)}, {'reply._id': new ObjectID(reply_id), 'reply.delete_password': delete_password}],
          returnNewDocument: true });
    })
    .then( result => {
      if(result.value){
        res.status(200).send('success');

      } else {
        res.status(200).send('incorrect password');
      }
    })
    .catch( err => {
      console.dir(err);
      res.status(500).send('database error');
    });
}

exports.deleteThread = function(req, res) {
  const boardName = req.params.board;
  const { thread_id, delete_password } = req.body;

  MongoCLient.connect(CONNECTION_STRING)
    .then( database => {
      return database.db(DB_NAME).collection(COLLECTION);
    })
    .then ( boardsCollection => {
      return boardsCollection.findOneAndUpdate( 
        { name: boardName, threads: { $elemMatch: { _id: new ObjectID(thread_id), delete_password: delete_password }} },
        { $pull: { threads: { _id: new ObjectID(thread_id) } }});
    })
    .then ( result => {
      if(result.value) {
        res.status(200).send('success');
      } else {
        res.status(200).send('incorrect password');
      }
    })
    .catch( err => {
      console.fir(err);
      res.status(500).send('database error');
    });
}