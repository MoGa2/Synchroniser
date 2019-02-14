/*
define([""], function(){*/
	/**
	 * Use semaphore to synchronize severals ASYNC.
	 * @exports Synchroniser
	 * @param {fn[]} callbacks - Callbacks called when all locks are released.
	 * @param {Boolean} isOrdered - Does lock release needs to be done in order.
	 * @param {Boolean} launch_init_at_start - Short hand to finalize the init state.
	 */
	var Synchroniser = function ( acallbacks, aisOrdered, launch_init_at_start ) 
	{
		var unique_num_lock = 0;
		var startReleaser;
		var initReleased;
		/** True when all locks are released */
		var open = false;

		/** Callbacks called when all locks are released */
		var callbacks = acallbacks;

		// ORDER REALTED VARIABLES------------------------
		var isOrdered = aisOrdered || false;
		var currentLockOrder = 0;
		var maxOrder = 0;
		var quededWaitingLocks = {};
				
		/** Object Literal whose propertys are { {string} lock_id : {boolean} is_open } 
		( PUBLIC FOR DEBUG PURPOSE ) */
		this.locks = {};
		/**
		 * Add one lock to the Synchroniser
		 * @param {string} lock - Lock's id ( DEBUG PURPOSE ).
		 * @return {fn} releaser - Function who can release the lock.
		 */

		this.addLock = function( lock )
		{
			lock = internal.getUniqueLock( lock );
			lock.order = maxOrder++;
					
			this.locks[ lock ] = true;
				
			var releaser = ( on_lock_released ) => 
			{	
				if ( !isOrdered || currentLockOrder == lock.order )
				{
					on_lock_released && typeof ( on_lock_released ) == "function" && on_lock_released();
					delete this.locks[ lock ];
					if ( isEmpty( this.locks ) )
					{
						internal.onAllLockReleased();
					}
							
					internal.executeNextLockIfAlreadyReleased();
				}
				else
				{
					quededWaitingLocks[ lock.order ] = lock;
				}
			}
			releaser.id = lock;
			return releaser;
		};
		
		/**
		 * Add a callback without adding a lock or execute the callback if all locks have already been released
		 * @param {fn} cb - callback.
		 */

		this.addCallback = function ( cb ) 
		{
			if ( open )
				cb();
			else
				callbacks.push( cb );
		};

		/**
		 * Release the start lock by calling startReleaser 
		 * Called by the user or on init
		 */

		this.InitOver  = function()
		{
			if ( initReleased )
				return;
					
			startReleaser();
			initReleased = true;
		};

		// KEEP BINDING IN NESTED CLOSURE ( releaser )
		var internal = 
		{
			init : function()
			{
				startReleaser = this.addLock( "START" );
				launch_init_at_start && this.InitOver();
			},
			/**
			 * Recursive fn that check if locks are waiting to be released ( quededWaitingLocks)
			 * Called when a lock is released.
			 * 
			 */
			executeNextLockIfAlreadyReleased : () =>
			{
				currentLockOrder++
				if ( Object.keys( quededWaitingLocks ).indexOf( currentLockOrder ) > -1 )
				{
					var on_lock_released = quededWaitingLocks[ currentLockOrder ];
					on_lock_released();
					executeNextLockIfAlreadyReleased()
				}
			},
				
			/**
			 * Recursive fn that check if locks are waiting to be released ( quededWaitingLocks)
			 * Called when a lock is released.
			 *( SHOULD BE PRIVATE ) 
			 */
			getUniqueNumLock : () =>
			{
				return unique_num_lock++;
			},
			
			/**
			 * Create a "unique" id .
			 * Called when a lock is added.
			 * ( SHOULD USE SYMBOL ) ( SHOULD BE PRIVATE ) 
			 */
			getUniqueLock : ( lock ) =>
			{
				var unique_num_lock = internal.getUniqueNumLock();
				return lock + "_" + unique_num_lock;
			},
			
			/**
			 * Execute all callbacks and change the state to open
			 * Called when all locks are open.
			 * ( SHOULD USE SYMBOL )
			 */
			onAllLockReleased : () => 
			{
				for ( var i = 0; i < callbacks.length ; i++ )
				{
					var current_cb = callbacks[ i ];
					current_cb && current_cb();
				}
						
				open = true;
			}		
		}	

				
		function isEmpty(map) 
		{
			for(var key in map) 
			{
				if (map.hasOwnProperty(key)) 
				{
					return false;
				}
			}
			return true;
		}
		
		internal.init.apply(this);

	};
	//return Synchroniser;
//}
//);