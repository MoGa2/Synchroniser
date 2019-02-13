define([], function(){
	var Synchroniser = function ( asuccess_cbs, ais_ordered, launch_init_at_start ) 
	{
		ais_ordered = ais_ordered || false;
		var closure_this =  this;
		var unique_num_lock = 0;
		var open = false;
		this.locks = {};
		this.success_cbs = asuccess_cbs;
			//	this.on_lock_released = aon_lock_released;
				this.is_ordered = ais_ordered;
				var current_lock_order = 0;
				var max_order = 0;
				var queded_waiting_locks = {};
				
				this.Execute_next_lock_if_already_released = function()
				{
					current_lock_order++
					if ( Object.keys( queded_waiting_locks ).indexOf( current_lock_order ) > -1 )
					{
						var on_lock_released = queded_waiting_locks[ current_lock_order ];
						on_lock_released();
						this.Execute_next_lock_if_already_released()
					}
				}
				
				this.Add_one_lock = function( lock )
				{
					lock = this.get_unique_lock( lock );
					//lock.on_lock_released = aon_lock_released;
					lock.order = max_order++;
					
					this.locks[ lock ] = true;
				
					//this.order = max_order;
					var releaser = function( on_lock_released ) 
					{	
					//	lock.on_lock_released = on_lock_released;
						if ( !closure_this.is_ordered || closure_this.current_lock_order == lock.order )
						{
							on_lock_released && typeof ( on_lock_released ) == "function" && on_lock_released();
							delete closure_this.locks[ lock ];
							if ( isEmpty( closure_this.locks ) )
							{
								closure_this.on_All_lock_opened();
							}
							
							closure_this.Execute_next_lock_if_already_released();
						}
						else{
							queded_waiting_locks[ lock.order ] = lock;
						}
					}
					releaser.id = lock;
					return releaser;
				};
				 
		
				this.get_unique_num_lock = function()
				{
					return unique_num_lock++;
				}
		
				this.get_unique_lock = function( lock )
				{
					var unique_num_lock = this.get_unique_num_lock();
					return lock + "_" + unique_num_lock;
				}
		
				this.on_All_lock_opened = function () 
				{
					for ( var i = 0; i < this.success_cbs.length ; i++ )
					{
						var current_cb = this.success_cbs[ i ];
						current_cb && current_cb();
					}
					
					open = true;
				};
			
				this.Add_callback = function ( cb ) 
				{
					if ( open )
						cb();
					else
						asuccess_cbs.push( cb );
				};
				
				
				this.InitOver  = function()
				{
					if ( this.init_released )
						return;
					
					this.start_releaser();
					this.init_released = true;
				};
				
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
				
				this.start_releaser = this.Add_one_lock( "start" );
				launch_init_at_start && this.InitOver();
				
	};
	return Synchroniser;
});