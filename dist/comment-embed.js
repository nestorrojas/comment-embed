/*
 * ALA Embedded Comment Utilities
 * https://github.com/alistapart/comment-embed
 *
 * Copyright (c) 2013 A List Apart
 * Licensed under the MIT license.
 */


(function( w, undefined ) {
	// Enable JS strict mode
	"use strict";

	var doc = w.document,
		ala = function( el ){
			var elType = typeof( el ),
				ret = [];

			if( el ){
				if( elType === "function" ){
					// Passing a function means it’s a `doc.ready` shortcut.
					return ala.ready( el );
				}

				if( elType === "object" ) {
					// If it’s an object, pass it on through.
					ret = ret.concat( el );
				}
				// If it’s a string, it’s a selector.
				if( elType === "string" ){
					for( var i = 0, sel = doc.querySelectorAll( el ), il = sel.length; i < il; i++ ){
						ret[ i ] = sel[ i ];
					}
				}
			}
			else {
				// No element? Return the wrapped document.
				ret.push( doc );
			}
			return ala.extend( ret, ala.fn );
		};

	ala.extend = function( first, second ) {
		for( var i in second ){
			if( second.hasOwnProperty( i ) ){
				first[ i ] = second[ i ];
			}
		}
		return first;
	};

	ala.ready = function( fn ){
		var ready = false,
			set = [],
			go = function(){
				if( !ready ){
					while( set.length ){
						set.shift().call( doc );
					}
					ready = true;
				}
			};

		// Quick IE8 shiv
		if( !w.addEventListener ){
			w.addEventListener = function( evt, cb ){
				return w.attachEvent( "on" + evt, cb );
			};
		}

		// DOM ready
		w.addEventListener( "DOMContentLoaded", go, false );
		w.addEventListener( "readystatechange", go, false );
		w.addEventListener( "load", go, false );
		// If DOM is already ready at exec time:
		if( doc.readyState === "complete" ){
			go();
		}
		if( ready && fn ){
			fn.call( doc );
		}
		else if( fn ){
			set.push( fn );
		}
		else {
			go();
		}
		return [doc];
	};

	ala.fn = {};

	ala.fn.each = function( fn ) {
		for( var i = 0, l = this.length; i < l; i++ ){
			fn.call( this[ i ], i );
		}
		return this;
	};

	ala.fn.data = function( key, val ) {
		if( key === undefined ) {
			return this[ 0 ].alaData;
		} else {
			if( val === undefined ){
				return this[ 0 ].getAttribute( "data-" + key ) || this[ 0 ].alaData && this[ 0 ].alaData[ key ];
			} else {
				return this.each(function(){
					if( !this.alaData ){
						this.alaData = {};
					}
					this.alaData[ key ] = val;
				});
			}
		}
	};

	ala.fn.bind = function( evt, callback ){
		var evts = evt.split( " " ),
			el = this;

		function newCB( e ){
			return callback.apply( el, [ e ].concat( e._args ) );
		}

		return this.each(function(){
			for( var i = 0, il = evts.length; i < il; i++ ){
				if( "addEventListener" in this ){
					this.addEventListener( evts[ i ], newCB, false );
				}
				else if( this.attachEvent ){
					this.attachEvent( "on" + evts[ i ], newCB );
				}
			}
		});
	};

	ala.fn.prev = function( ){
		var prev = this[ 0 ].previousSibling;

		while( prev && prev.nodeType !== 1 ) {
			prev = prev.previousSibling;
		}
		return prev;
	};

	ala.fn.trigger = function( evt, args ){
		var evts = evt.split( " " );
		return this.each(function(){
			for( var i = 0, il = evts.length; i < il; i++ ){
				// Real browsers:
				if( doc.createEvent ){
					var ev = doc.createEvent( "Event" );
					ev.initEvent( evts[ i ], true, true );
					ev._args = args;
					this.dispatchEvent( ev );
				} else if ( doc.createEventObject ) {
					// IE8:
					var ieev = doc.createEventObject();
					ieev._args = args;
					ieev.eventType = evt;
					this.fireEvent( evt, ieev );
				}
			}
		});
	};

	ala.fn.throttle = function( fn, delay ) {
		var timer = null;
		
		return function () {
			var context = this, args = arguments;
			clearTimeout(timer);
			timer = setTimeout(function () {
				fn.apply(context, args);
			}, delay );
		};
	};

	var xmlHttp = (function() {
		var xmlhttpmethod = false;
		try {
			xmlhttpmethod = new XMLHttpRequest();
		}
		catch( e ){
			xmlhttpmethod = new ActiveXObject( "Microsoft.XMLHTTP" );
		}
		return function(){
			return xmlhttpmethod;
		};
	}());
	
	ala.ajax = function( url, options ) {
		var req = xmlHttp(),
		settings = ala.ajax.settings;
		
		if( options ){
			ala.extend( settings, options );
		}
		if( !url ){
			url = settings.url;
		}
		
		if( !req || !url ){
			return;
		}
		
		req.open( settings.method, url + settings.data, settings.async );
		
		req.onreadystatechange = function () {
			if ( req.readyState !== 4 || req.status !== 200 && req.status !== 304 ){
				return settings.error( req.responseText );
			} else if ( req.readyState === 4 ) {
				settings.success( req.responseText, req.status, req );
			}
		};
		if( req.readyState === 4 ){
			return;
		}

		req.send( null );
	};
	
	ala.ajax.settings = {
		success: function(){},
		error: function(){},
		method: "GET",
		async: true,
		data: null
	};

	w.ala = ala;

}( this ));
/*
 * ALA Embedded Comments
 * https://github.com/alistapart/comment-embed
 *
 * Copyright (c) 2013 A List Apart
 * Licensed under the MIT license.
 */

(function( w, undefined ) {
	// Enable JS strict mode
	"use strict";

	var ala = w.ala,
		initEl = "script",
		o = {
			pluginName : "comment-embed",
			endpoint: "sample-endpoint.php"
		},
		methods = {
			_init: function(){
				var el = ala( this );

				if( el.data( "init" ) === true ) {
					return false;
				}

				return ala( this )
					.trigger( o.pluginName + "-create" )
					.data( "init", true )
					[ o.pluginName ]( "_fetchData" );
			},
			_injectiframe: function( data ) {
				var iframe = document.createElement( "iframe" ),
					script = ala( this ),
					commentid = script.data( "comment" ),
					prev = ala( this ).prev();

				// Make the iframe seamless-ish.
				iframe.width = "100%";

				iframe.frameborder = "0";
				iframe.style.padding = "0";
				iframe.scrolling = "no";
				iframe.style.border = "none";
				iframe.style.minHeight = "96px";

				if( prev && prev.getAttribute( "id" ) === "comment-" + commentid ) {
					// If the fallback markup is there, replace it.
					this.parentNode.replaceChild( iframe, prev );
				} else {
					// If isn’t there (tsk tsk) insert the iframe before the script element.
					this.parentNode.insertBefore( iframe, this );
				}

				iframe.contentWindow.document.write( data );
				script[ o.pluginName ]( "_handleResize", iframe );
			},
			_fetchData: function() {
				var el = ala( this ),
					commentid = el.data( "comment" );

				ala.ajax( o.endpoint, {
					// We’ll need to enable CORS on the endpoint side for this to work. We could chuck an `src` into the `iframe`, but resizing it would be a lot trickier.
					data: "?id=" + commentid,
					async: false,
					success: function( data ) {
						el[ o.pluginName ]( "_injectiframe", data );
					}
				});
			},
			_handleResize: function( iframe ) {
				var fixHeight = function() {
						iframe.height = iframe.contentWindow.document.getElementById( "comment" ).scrollHeight + 25;
					};
				setTimeout(function() {
					fixHeight();
				}, 100);
				ala( w ).bind( "resize", ala.fn.throttle( fixHeight, 100 ) );
			}
		};

	ala.fn[ o.pluginName ] = function( arrg, a, b, c ) {
		return this.each(function() {
			if( arrg && typeof( arrg ) === "string" ){
				return ala.fn[ o.pluginName ].prototype[ arrg ].call( this, a, b, c );
			}
			if( ala( this ).data( o.pluginName + "data" ) ){
				return ala( this );
			}
			ala( this ).data( o.pluginName + "active", true );
			ala.fn[ o.pluginName ].prototype._init.call( this );
		});
	};

	ala.extend( ala.fn[ o.pluginName ].prototype, methods );

	ala( initEl ).each(function() {
		var el = ala( this );

		if( el.data( "comment" ) ) {
			el[ o.pluginName ]();
		}
	});
}( this ));