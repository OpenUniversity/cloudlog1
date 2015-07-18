"use strict";

var assert = require("assert");
var CedalionInterface = require("../cedalionInterface.js");
var Namespace = require("../namespace.js");
var EventEmitter = require('events').EventEmitter;

describe('CedalionInterface', function(){
    var ced = new CedalionInterface('/tmp/ced.log');
    var impred = new Namespace('/impred');
    impred._define(['greet', 'pred', 'userInput']);
    var builtin = new Namespace('builtin');
    builtin._define(['succ']);
    describe('.eval(res, impred)', function(){
	it('should return an event emitter', function(done){
	    var X = {var:'X'};
	    var em = ced.eval(X, impred.greet(X));
	    assert(em instanceof EventEmitter, em + ' instanceof EventEmitter');
	    // A 'done' event should be emitted
	    em.on('done', done);
	});
	it('should emit a "solution" event for each solution', function(done){
	    var X = {var:'X'};
	    var em = ced.eval(X, impred.pred(builtin.succ(1, X)));
	    var solutions = [];
	    em.on('solution', function(val) {
		solutions.push(val);
	    });
	    em.on('done', function() {
		assert.deepEqual(solutions, [2]);
		done();
	    });
	});
	it('should emit a "continuation" event for continuations', function(done){
	    var X = {var:'X'};
	    var em = ced.eval(X, impred.greet(X));
	    var resp = [];
	    em.on('continuation', function(task, cont) {
		resp.push(task);
		assert.equal(typeof cont, 'function');
	    });
	    em.on('done', function() {
		assert.deepEqual(resp, [impred.userInput()]);
		done();
	    });
	});
	it('should provide a continuation function to allow continued evaluation', function(done){
	    var X = {var:'X'};
	    var em = ced.eval(X, impred.greet(X));
	    em.on('continuation', function(task, cont) {
		assert.deepEqual(task, impred.userInput());
		var em2 = cont("world");
		em2.on('solution', function(sol) {
		    assert.equal(sol, 'Hello, world');
		    done();
		});
	    });
	});
	it('should not mix events between different requests', function(done){
	    var X = {var:'X'};
	    var em1 = ced.eval(X, impred.pred(builtin.succ(1, X)));
	    var em2 = ced.eval(X, impred.pred(builtin.succ(X, 2)));
	    var count = 2;
	    em1.on('solution', function(val) {
		assert.equal(val, 2);
	    });
	    em2.on('solution', function(val) {
		assert.equal(val, 1);
	    });
	    function onDone() {
		count -= 1;
		if(count === 0) {
		    done();
		}
	    }
	    em1.on('done', onDone);
	    em2.on('done', onDone);
	});

    });
});
