;(function($){ 
	"use strict";	
	
	jQuery.event.props.push("dataTransfer");
	
	//Take a url and put the dataurl info in the master data field
	function setMasterDataFromUrl(id,url,baseobj){			 
		var can = document.getElementById(id+'_ws'),
			ctx = can.getContext('2d'),
			img = new Image();
		
		//specify the source which triggers the onload event
		img.src = url;
		
		img.onload = function () {
			can.width = img.width; 
			can.height = img.height; 
			
			baseobj.data('masterWidth',img.width);
			baseobj.data('masterHeight',img.height);
			ctx.drawImage(img, 0, 0, img.width, img.height); 
			//draw the image onto the canvas then pull the data and put it in the eimgmasterdata field
			var canvasData = can.toDataURL("image/png"); 
			$('#editable_'+id+' .eimgmasterdata').val(canvasData);					
		};							
	}	
	
	var methods = {
		init : function( options ){
			var $this = $(this),
				opts = $.extend({}, $.fn.eimg.defaults, options),
				id = $this.attr('id'),
				editorId = 'editable_' + id;			
			
			// set up the data values of this editor using the defaults, options and any tag specified values
			initElementData();
			
			// Build the UI for the editor
			buildEditor(id,$this.data('previewWidth'),$this.data('previewHeight'));

			// Get the value for the mastersrc field
			setDefaultMasterSrc();

			//Add all the click and change events to the elements
			configureUIEvents();
			
			function initElementData(){					
				// check for any data elements that are set on the specific element and override the defaults if they are... 
				// set the values in the item data for state
				setElementSpecificData('previewWidth');
				setElementSpecificData('imageEncoding');
			
				setElementSpecificData('src');
				setElementSpecificData('mastersrc');
				setElementSpecificData('aspectRatio');	
				setElementSpecificData('cropBgWidth');	
				setElementSpecificData('minUploadWidth');	
				setElementSpecificData('minUploadHeight');					
				
				// Calculate the height of the preview and the cropper initial height using the aspect ratio
				$this.data('previewHeight',$this.data('previewWidth')/$this.data('aspectRatio'));
				$this.data('minCropWidth',100);
				$this.data('minCropHeight',100/$this.data('aspectRatio'));
				
				$this.data('masterWidth','');
				$this.data('masterHeight','');				
				
				//Set the width and height of the current element to those calculated.
				$this.attr('width',$this.data('previewWidth'));
				$this.attr('height',$this.data('previewHeight'));
				
			}
						
			function buildEditor(id,w,h){	
							
				var editorId = 'editable_' + id,
					workspace = "<canvas id='"+id+"_ws' class='workspace' width='"+ w +"' height='"+ h +"' style='width:"+ w +"px; height:"+ h +"px;'></canvas>",
					datafields = "<input type='hidden' class='eimgmasterdata' id='eimg_master_"+id+"' name='eimg_master_"+id+"' /><input type='hidden' class='eimgcropdata' id='eimg_crop_"+id+"' name='eimg_crop_"+id+"' /><input type='hidden' class='eimgcoords' id='eimg_coords_"+id+"' name='eimg_coords_"+id+"' />",
					editorDialog = "<div id='"+editorId+"_dialog' class='eimgDialog' ><img class='masterImage' src='' /></div>",
					toolbar = "<div class='toolbar'><a class='btnCancel' ><i class='icon-undo'  title='Cancel'  /> Cancel</a><a class='btnUpload'  title='Create from new image' ><i class='icon-picture' /><a class='btnEdit' title='Edit'  ><i class='icon-pencil' /></a></div>",
					fileInput="<div class='fileInput'><div class='dropbox'><span>Drop an image here or <br /><i class='icon-arrow-down' /></span></div><input class='eimgFileInput' type='file' id='"+editorId+"_file' name='"+editorId+"_file' accept='image/*;capture=camera'></div>";

				//add an wrapper around the element so we can add interface items to it
				$this.wrap(function() {
					return '<div class="editableImage" style="width:' + w + 'px; height:' + h + 'px;"  data-img="' + id + '" id="editable_' + id + '" />';
				});			
				
				// Add the defined interface items to the editor wrapper
				$('#'+editorId).append(datafields+ workspace+toolbar+fileInput);
				$('body').append(editorDialog);
				
				//Check for the jcrop plugin and remove the edit button if it is not present
				if(typeof(jQuery().Jcrop) === 'undefined' ){								
					$("#"+editorId+" .toolbar .btnEdit").remove();
				}

				//Add the drag and drop functionality to the editor
				$('#'+editorId+' .dropbox,#'+id )
					.on('drop',	function (e) {
						e.stopPropagation();
						e.preventDefault();	
						$this.eimg('handleFiles',e.dataTransfer.files);
					})
					.on('dragenter dragover', function (e) {
						e.stopPropagation();
						e.preventDefault();
					});					
				
				//Prevent the default behaviour of the page drop
				$(document).on('drop dragover', function (e){
					e.preventDefault();
					return false;
				});				
			}			
	
			function setDefaultMasterSrc(){	
				//check the mastersrc and src values
				// if there is no src but is mastersrc then src = mastersrc
				// else if is src but no mastersrc then mastersrc = src
				if($this.data('mastersrc') !== '' && $this.data('src') === ''){
					$this.data('src', $this.data('mastersrc'));
				} else if ($this.data('src') !== '' && $this.data('mastersrc') === ''){
					$this.data('mastersrc', $this.data('src'));
				}
				
				// Set the masterdata if there is any and set the edit button if we have a current image
				if($this.data('src') !== ''){			
					setMasterDataFromUrl($this.attr('id'),$this.data('mastersrc'),$this);
					$this.css("background-image", "url("+$this.data('src')+")"); 
					$("#"+editorId+" .toolbar .btnEdit").show();				
				}			
			}
			
			function configureUIEvents(){
				//Preview cancel click function
				$("#"+editorId+" .toolbar .btnCancel").click(function(){
					// clear the preview canvas
					clearCanvas(id,$this.data('previewWidth'),$this.data('previewHeight'));			
					
					// clear the  form input fields
					$("#"+editorId+" input").val('');
					
					//reset the master data to what it originally was
					if($this.data('src') !== ''){					
						setMasterDataFromUrl($this.attr('id'),$this.data('mastersrc'),$this);
						$this.css("background-image", "url("+$this.data('src')+")"); 
						$("#"+editorId+" .toolbar .btnEdit").show();						
					} else {
						$this.css("background-image", "url('t_bg.png')");
						$("#"+editorId+" .toolbar .btnEdit").hide();	
					}				
					
					//hide the cancel button
					$(this).hide();					
				});		

				//picture upload button click function
				$("#"+editorId+" .toolbar .btnUpload").click(function(){				
					$("#"+editorId+" .fileInput").show('fast');
				});

				// browse file input change function
				$("#" + editorId + " .eimgFileInput").on('change', function(event) {				
					$("#"+editorId+" .fileInput").hide();
					$this.eimg('handleFiles',event.target.files);
				});	
				
				//Open editor button function
				$("#"+editorId+" .toolbar .btnEdit").click(function(){								
					if($('#'+editorId+' .eimgmasterdata').val() !== ''){
						$this.eimg('displayCropperDialog',$('#'+editorId+' .eimgmasterdata').val());
						
						
						
					}									
				});				
			}
		
			function clearCanvas(id,w,h){				
				document.getElementById(id).getContext('2d').clearRect(0,0,w,h);			
			}

			function setElementSpecificData(key){
				// if there is no data attribute specified in the tag then put the default or option in the data field
				if( typeof($this.data(key)) === 'undefined'){
					$this.data(key, opts[key]);
				}
			}
		},
		
		handleFiles: function(files){
			//todo: test for jcrop and disallow files that are not the correct dimensions
			var $this = $(this),
				editorId = 'editable_' + $this.attr('id'),
				fileLoader = new FileReader(),
				file = files[0];
			
			//only use the first file (file[0])  and make sure its an image
			if (file.type.match('image.*')) {
				fileLoader.onload = function() {	
					var data = this.result,
					img = new Image();
					//Once loaded put the image dile data in the masterimage input field
								
		
					//specify the source which triggers the onload event
					img.src = data;
			
					img.onload = function () {	

						if( img.width > $this.data('minUploadWidth') &&  img.height > $this.data('minUploadHeight') ){
							$this.data('masterWidth',img.width);
							$this.data('masterHeight',img.height);
							
							//check for jcrop and if its there show the crop dialog
							if(jQuery().Jcrop) {
								$this.css("background-image", "url('t_bg.png')");
								$this.eimg('displayCropperDialog',data);
							} else {
								//console.log('JCrop plugin required');
							}

							$('#'+editorId+' .eimgmasterdata').val(data);	
							
						} else {	
							alert("The image must be at least " +$this.data('minUploadWidth')+ "px wide and "+$this.data('minUploadHeight')+"px high ");
						}						
					};
				};
				
				fileLoader.readAsDataURL(file);
				
				fileLoader.onabort = function() {
					alert("The upload was aborted.");
				};
				fileLoader.onerror = function() {
					alert("An error occured while reading the file.");
				};				

			} else {
				alert("bmp,gif,jpg and png images only");
			}		

		},
	
	
		cropImage: function(data,c) {
			var $this = $(this),
				context = document.getElementById($this.attr('id')+'_ws').getContext('2d'),
				imageObj = new Image();
			
			//load the data into the image object which triggers the onload function once loaded
			imageObj.src = data;		
			
			//the onload function calculates the correct size, crop of the new image and loads it onto the hidden workspace canvas
			imageObj.onload = function() {				
				var sourceX = c.x,
					sourceY = c.y,
					sourceWidth = c.w,
					sourceHeight = c.h,
					destX = 0,
					destY = 0,
					destWidth = $this.data('previewWidth'),
					destHeight = $this.data('previewHeight');	
				
				context.clearRect(0,0,destWidth,destHeight);
				context.drawImage(imageObj, sourceX, sourceY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight);
			};
		},
		
		displayCropperDialog: function(data) {
			var $this = $(this),
				editorId = 'editable_' + $this.attr('id');			

			//rebuild the cropper and show it
			$( "#"+editorId+"_dialog" )
				.empty()			
				.append("<div  class='dialogInner' style='width:"+($this.data('cropBgWidth')+6)+"px;'><img class='masterImage' src='' /><div style='width:"+$this.data('cropBgWidth')+"px;' class='imgCropToolbar'><a class='btnCancel' title='Cancel'  ><i class='icon-undo' /> Cancel</a> &nbsp;<a class='btnOk'  title='Crop' ><i class='icon-ok' /> Ok</a></div></div>")			
				.show();
			
			// load the background image from the data argument passed in
			$( "#"+editorId+"_dialog img" ).attr("src", data);			
			
			var img = $( "#"+editorId+"_dialog img" );
			
			$( "#"+editorId+"_dialog" ).attr('style','display:block;height:'+$(document).height()+'px');
			
			// cropper dialog cancel button function
			$("#"+editorId+"_dialog .btnCancel ").on('click',function(){
				$this.data('jcrop_api').destroy();				
				setMasterDataFromUrl($this.attr('id'),$this.data('mastersrc'),$this);
				$this.css("background-image", "url("+$this.data('src')+")"); 
				$("#"+editorId+"_dialog").empty().hide();
			});

			// cropper dialog ok button function
			$("#"+editorId+"_dialog .btnOk ").on('click',function(){				
				var data = document.getElementById($this.attr('id')+'_ws').toDataURL($this.data('imageEncoding')),
					context = document.getElementById($this.attr('id')).getContext('2d'),
					imageObj = new Image();				
				
				// get the cropped image data
				$( "#"+editorId+" .eimgcropdata" ).val(data);				
				
				//clear the current preview canvas
				$this.empty();

				//put the crop image data into a dummy image which will fire the onload function
				imageObj.src = data;
				
				imageObj.onload = function() {		
					//clear the preview canvas and draw the new image onto it
					context.clearRect(0,0,$this.data('previewWidth'),$this.data('previewHeight'));
					context.drawImage(imageObj,0,0);				
				};		
				
				//kill the dialog and jcrop
				$this.data('jcrop_api').destroy();
				$("#"+editorId+"_dialog").empty().hide();
				$("#"+editorId+" .fileInput").hide();
				
				//diaplay the preview toolbar function buttons
				$("#"+editorId+" .toolbar .btnCancel").show();
				$("#"+editorId+" .toolbar .btnEdit").show();					
			});
			
			//instantiate the jcrop component			
			$("#"+editorId+"_dialog .masterImage ").Jcrop({
			
					aspectRatio: $(this).data('minCropWidth') / $(this).data('minCropHeight'),
					minSize: [$(this).data('minCropWidth') , $(this).data('minCropHeight')],
					onSelect: cropChangeHandler,
					boxWidth        : $(this).data('cropBgWidth'),
					setSelect:   [ Number($this.data('masterWidth')/4),Number( ($this.data('masterWidth')/4)/$this.data('aspectRatio')),Number($this.data('masterWidth')/2),Number( ($this.data('masterWidth')/2)/$this.data('aspectRatio') ) ]
				},function(){
					// store the jcrop api in the editors data object to use
					$this.data('jcrop_api',this);

					$( "#"+editorId+" .imgCropToolbar" ).css('width', $( "#"+editorId+" .jcrop-holder" ).css('width') );
				}			
			);

			$j('html, body').animate({
				 scrollTop: $j(".dialogInner").offset().top
			}, 500);			
			
			
			// this function is fire every time the jcrop tool is altered
			// It calculates the crop image data and stores both that 
			// and the cropping coordinates in the editor form fields
			function cropChangeHandler(c){						
				//crop the image (from the masterdata) and save it on a hidden canvas
				$this.eimg('cropImage',$( "#"+editorId+" .eimgmasterdata" ).val(),c);				
				$( "#"+editorId+" .eimgcoords" ).val(JSON.stringify(c));
			}
		}
	};
	
	$.fn.eimg = function(method) { 
		if ( methods[method] ) {
			return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || ! method ) {
			return methods.init.apply( this, arguments );
		} else {
			$.error( 'Method ' +  method + ' does not exist on jQuery.tooltip' );
		}
	};
	
	// plugin defaults - added as a property on our plugin function
	$.fn.eimg.defaults = {	
	
		
		previewWidth	: 200,
		minUploadWidth	: 100,	
		minUploadHeight	: 100,			
		imageEncoding	: 'image/png' ,
		cropBgWidth	:600,		
		src		: '',
		mastersrc	: '',
		onUpload		: function(){},
		onFinishEdit	: function(){},		
		aspectRatio		: 2			
		
	};	

})(jQuery);