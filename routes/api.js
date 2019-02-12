/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;

const boardController = require('../controllers/boardController');

module.exports = function (app) {
  
  app.route('/api/threads/:board')
    .get()
    .post(boardController.postThread)
    .put(boardController.reportThread)
    .delete();
    
  app.route('/api/replies/:board')
    .get()
    .post(boardController.postReplay)
    .put(boardController.reportReply)
    .delete(boardController.deleteReply);

};
