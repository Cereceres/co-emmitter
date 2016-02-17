'use strict'
const EventEmitter = require( 'events' );
const co = require( 'co' )
let funBuilder, chaining, toGenerator


/**
 * slice() reference.
 */

let slice = Array.prototype.slice;
/**
 * @param {Object} to be use as thisArg in every generator
 * @return {Object} instance of coEvent
 * @api public
 */
let CoEvent = function ( ctx ) {
    /**
     * if is not called with new, a instance of coEvent is returned
     */
    if ( !( this instanceof CoEvent ) ) {
      return new CoEvent( )
    }
    /**
     *  EventEmitter is instanced and added to object
     */
    this.emitter = new EventEmitter( )
    this.events = {}
      /**
       *  ctx to be used in every generator
       */
    ctx = ctx || this
    var _this = this
      /**on method to be added to instance*/
      /**
       * @param {String} event {Array} of generator to be used, can be too onle one generator
       * @return {Boolean} is listener was added
       * @api public
       */
    this.on = function ( event, _eventHandler ) {
        _eventHandler = arguments.length > 2 ? slice.call( arguments, 1 ) : [
          _eventHandler
        ]
        let eventHandler = toGenerator( _eventHandler )
        this.events[ event ] = this.events[ event ] || {}
        this.events[ event ].eventHandlerGen = this.events[ event ].eventHandlerGen !==
          undefined ? this.events[ event ].eventHandlerGen : [ ]
          /**The news generator are added*/
        this.events[ event ].eventHandlerGen = this.events[ event ].eventHandlerGen
          .concat( eventHandler )
          /**The old generators are removed*/
        this.emitter.removeAllListeners( event )
        let arrayOfeventHandlerGen = this.events[ event ].eventHandlerGen
        this.emitter.addListener( event, function ( arg, res, rej ) {
          co( chaining( arg, arrayOfeventHandlerGen, 0 ) )
            .then( function ( ) {
              /**The promse es resolved*/
              res( )
            } )
            .catch( function ( err ) {
              /**If there are a error error event is ammited and promise es rejected*/
              _this.emitter.emit( 'error', err )
              rej( err )
            } )
        } )
        return this
      }
      /**
       * @param {String} event {Array} of generator to be used, can be too onle one generator
       * @return {Boolean} is listener was added once
       * @api public
       */
    this.once = function ( event, eventHandler ) {
        this.events[ event ] = this.events[ event ] || {}
        this.events[ event ].eventHandlerGen = this.events[ event ].eventHandlerGen || [
          eventHandler
        ]
        this.events[ event ].eventHandlerFun = funBuilder( this.events[ event ]
          .eventHandlerGen )
        this.emitter.removeAllListeners( event )
        this.emitter.once( event, this.events[ event ].eventHandlerFun )
      }
      /**
       * @param {String} event {Obejct} to be serd the listener
       * @return {Promise} to be resolved when every iterator finish or rejected
       * if a error happen
       * @api public
       */
    this.emit = function ( _event, arg ) {
        arg = arguments.length > 2 ?
          slice.call( arguments, 1 ) : [ arg ];
        return new Promise( function ( resolve, reject ) {
          _this.emitter.emit( _event, arg, resolve, reject )
        } );
      }
      /**
       * @param {Object}arg {Array} generators {Number} index of array of generators
       * @return {function} chained
       * @api private
       */
    chaining = function ( arg, array, index ) {
        if ( index < ( array.length - 2 ) ) {
          return array[ index ].apply( ctx, arg.concat( chaining( arg, array,
            index +
            1 ) ) )
        } else {
          return array[ index ].apply( ctx, arg.concat( array[ index + 1 ].apply(
            ctx,
            arg ) ) )
        }

      }
      /**
       * @param {Array} map the arg to be a generators
       * @api private
       */
    toGenerator = function ( fns ) {
      fns = Array.isArray( fns ) ? fns : [ fns ]
      return fns.map( function ( fn ) {
        if ( fn.constructor.name === 'GeneratorFunction' ) {
          return fn
        } else if ( typeof fn === 'function' ) {
          return function* ( ) {
            let arg = slice.call( arguments, 0 )
            yield toGenerator( fn.apply( ctx, arg ) )
          }
        }
        return fn
      } )
    }
  }
  /**
   * Expose `coEvent`.
   */
module.exports = CoEvent
