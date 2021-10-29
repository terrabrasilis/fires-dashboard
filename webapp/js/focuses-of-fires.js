var graph={
		
	data:[],
	totalRows:0,
	bydata:"prodes",// default on UI
	selectedBiome:"a",// a=Amazônia and c=Cerrado
	config:{},
	selectedFilters:{},
	ctlFirstLoading:false,
	
	totalizedFocusesInfoBox:undefined,// totalized focuses info box
	barMonthFiresByClass: null,
	ringTotalizedByState:undefined,
	histTopByCLs:undefined,
	
	palletBarChartProdes: ["#c7f8e3","#9bf8d0","#49d398","#238b45"],
	palletBarChartCar: ["#feebe2","#fbb4b9","#f768a1","#c51b8a","#7a0177"],
	palletPieChartProdes: ["#fbb4ae","#b3cde3","#ccebc5","#decbe4","#fed9a6","#ffffcc","#e5d8bd","#fddaec","#f2f2f2"],
	palletPieChartCar: ["#fbb4ae","#b3cde3","#ccebc5","#decbe4","#fed9a6","#ffffcc","#e5d8bd","#fddaec","#f2f2f2"],

	getOrdinalColorsClasses: function() {
		let c=[];
		let cls=graph.config.dataConfig.legendOriginal[graph.bydata];
		let cor=(graph.bydata=='prodes')?(graph.palletBarChartProdes):(graph.palletBarChartCar);
		for(let i=0;i<cls.length;i++) {
			c.push({key:cls[i],color:cor[i]});
		}
		return c;
	},

	/**
	 * Load configuration file before loading data.
	 */
	setConfigurations: function(conf) {
		if(conf) {
			graph.palletBarChartProdes=conf.palletBarChartProdes?conf.palletBarChartProdes:graph.palletBarChartProdes;
			graph.palletPieChartProdes=conf.palletPieChartProdes?conf.palletPieChartProdes:graph.palletPieChartProdes;
			graph.palletBarChartCar=conf.palletBarChartCar?conf.palletBarChartCar:graph.palletBarChartCar;
			graph.palletPieChartCar=conf.palletPieChartCar?conf.palletPieChartCar:graph.palletPieChartCar;
			graph.defaultHeight=conf.defaultHeight?conf.defaultHeight:graph.utils.getDefaultHeight();
		}else{
			console.log("Didn't load config file. Using default options.");
		}
	},

	init:function(config, data) {

		if(data.length==0 || data.exception!==undefined) {
			this.displayWarning(true);
			return;
		}
		
		Lang.apply();
		
		graph.setConfigurations(config.dataConfig);

		if(this.loadData(false, data)) {
			
			this.displayWaiting(false);
			this.config=config;
			this.totalizedFocusesInfoBox = dc.numberDisplay("#numpolygons");
			this.barMonthFiresByClass = dc.barChart("#chart-bar-by-month-class");
			this.ringTotalizedByState = dc.pieChart("#chart-ring-by-state");
			this.histTopByCLs = dc.rowChart("#chart-hist-top-cls");
			
			graph.build();
		}
	},
	
	displayWaiting: function(enable) {
		if(enable===undefined) enable=true;
		d3.select('#charts-panel').style('display',((enable)?('none'):('')));
		d3.select('#loading_data_info').style('display',((!enable)?('none'):('')));
		d3.select('#info_container').style('display',((!enable)?('none'):('')));
		d3.select('#panel_container').style('display',((enable)?('none'):('')));
		d3.select('#warning_data_info').style('display','none');
	},
	
	displayWarning:function(enable) {
		if(enable===undefined) enable=true;
		document.getElementById("warning_data_info").style.display=((enable)?(''):('none'));
		document.getElementById("warning_data_info").innerHTML='<h3><span id="txt8">'+Translation[Lang.language].txt8+'</span></h3>';
		document.getElementById("loading_data_info").style.display=((enable)?('none'):(''));
	},
	
	loadData: function(error, data) {
		if(error) {
	    	console.log(error);
	    	return false;
		}else{
			graph.totalRows = data.length;
			graph.data = data;
			graph.normalizeData();
			return true;
		}
	},

	startLoadData: function() {

		var afterLoadConfiguration=function(cfg) {
			graph.displayWaiting();
			var configDashboard={resizeTimeout:0, minWidth:250, dataConfig:cfg};
			// var dataUrl = "./data/focuses-of-fires-"+graph.bydata+".json";
			let dataUrl = downloadCtrl.getFileDeliveryURL()+"/download/"+downloadCtrl.getProject()+"/fof_"+graph.bydata;
			var afterLoadData=function(json) {
				Lang.apply();
				if(!json || !json.features) {
					graph.displayWarning(true);
				}else{
					graph.init(configDashboard, json.features);
					graph.setUpdatedDate(json.updated_date);
				}
			};
			d3.json(dataUrl)
			.header("Authorization", "Bearer "+( (Authentication)?(Authentication.getToken()):("") ) )
			.get(function(error, root) {
				if(error && error.status==401) {
					console.error(error);
				}else{
					afterLoadData(root);
				}
			});
		};
		d3.json("./config/"+downloadCtrl.getProject()+".json", afterLoadConfiguration);
	},

	setUpdatedDate: function(updated_date) {
		var dt=new Date(updated_date+'T21:00:00.000Z');
		d3.select("#updated_date").html(' '+dt.toLocaleDateString());
	},
	
	setDataDimension: function(d) {
		this.bydata=d;
		this.restart();
	},

	setBiome: function(link,d) {
		$('[id^=toAggregatedChart]').removeClass('enable_menu')
		$('#toAggregatedChart-'+link).addClass('enable_menu');
		this.selectedBiome=d;
		this.restart();
	},

	utils:{

		mappingClassNames: function(cl) {
			if(graph.config.dataConfig.legendOriginal===undefined || !graph.config.dataConfig.legendOriginal[graph.bydata]) {
				return cl;
			}
			var l = graph.config.dataConfig.legendOriginal[graph.bydata].length;
			for (var i = 0; i < l; i++) {
				if(graph.config.dataConfig.legendOriginal[graph.bydata][i]===cl) {
					cl=graph.config.dataConfig.legendOverlay[graph.bydata][Lang.language][i];
					break;
				}
			}
			return cl;
		},

		downloadCSV:function(data, suffix /*file name suffix*/){
			let my_cvs = d3.dsv(";", "text/csv");
			var blob = new Blob([my_cvs.format(data)], {type: "text/csv;charset=utf-8"});
			saveAs(blob, ( (suffix)?(suffix):("") )+downloadCtrl.getProject()+'-month-'+downloadCtrl.getDownloadTime()+'.csv');
		},

		setStateAnimateIcon: function(id, enable, error) {
			document.getElementById(id).style.display='';
			if(enable) {
				document.getElementById(id).className="glyphicon glyphicon-refresh glyphicon-refresh-animate";
			}else {
				document.getElementById(id).className="glyphicon " + ( (error)?("glyphicon-warning-sign glyphicon-red"):("glyphicon-ok glyphicon-green") );
			}
		},
		getSelectedFormatFile: function() {
			var opt=document.getElementById('download-option');
			if(!opt) {
				opt="SHAPE-ZIP";
			}
			return opt[opt.selectedIndex].value;
		},
		/*
		 * Remove numeric values less than 1e-6
		 */
		removeLittlestValues:function(sourceGroup) {
			return {
				all:function () {
					return sourceGroup.all().filter(function(d) {
						return (Math.abs(d.value)<1e-6) ? 0 : d.value;
					});
				},
				top: function(n) {
					return sourceGroup.top(Infinity)
						.filter(function(d){
							return (Math.abs(d.value)>1e-6);
							})
						.slice(0, n);
				}
			};
		},

		/* Insert a title into one chart using a div provided by elementId.
		   Use %dim% or %Dim% to insert a dimension name or capitalize first letter of the name into your title string.
		 */
		setTitle:function(elementId, title) {
			elementId='title-chart-'+elementId;
			document.getElementById(elementId).innerHTML=this.wildcardExchange(title);
		},
		
		wildcardExchange:function(str) {
			var dim=(graph.bydata=='prodes')?(Translation[Lang.language].bydata):(graph.bydata.toUpperCase());
			str=str.replace( /%dim%/gi,function(x){ return dim; } );
			return str;
		},
		
		numberByUnit:function(num,displayPercent) {
			let percent=(num*100/graph.totalFocusesGroup.value().n).toFixed(1)+"%";
			let nf=localeBR.numberFormat(',')
			return "\n"+nf(num.toFixed(0)) +" "+ Translation[Lang.language].unit_focus + ((displayPercent)?("\n("+percent+")"):(""));
		},

		onResize:function(event) {
			clearTimeout(graph.config.resizeTimeout);
			graph.config.resizeTimeout = setTimeout(graph.doResize, 100);
		},

		getDefaultHeight:function() {
			return ((window.innerHeight*0.4).toFixed(0))*1;
		}
	},
	doResize:function() {
		graph.defaultHeight = graph.utils.getDefaultHeight();
		dc.renderAll();
	},
	normalizeData:function() {
		var json=[];
		// normalize/parse data
		this.data.forEach(function(d) {
			if(d.properties.b==graph.selectedBiome) {// filter by selected biome
				let mm=(+d.properties.m<10)?("0"+d.properties.m):(d.properties.m);
				var o={uf:d.properties.e,cl:d.properties.c,my:d.properties.y+"/"+mm,t:d.properties.t};
				var auxDate = new Date(d.properties.y+'-'+ mm + '-01T04:00:00.000Z');
				o.ts = auxDate.getTime();
				json.push(o);
			}
		});
		
		this.data=json;
		delete json;
	},
	
	build:function() {
		
		let dimensions=[];
		// set crossfilter
		let focuses = crossfilter(this.data);
		dimensions["my"] = focuses.dimension(function(d) {return d.my;});// month/year
		dimensions["ts"] = focuses.dimension(function(d) {return +d.ts;});// timestamp
		dimensions["uf"] = focuses.dimension(function(d) {return d.uf;});
		dimensions["cl"] = focuses.dimension(function(d) {return d.cl;});
		
		graph.utils.dimensions=dimensions;
		let groups=[];
		groups["clt"] = dimensions["my"].group().reduce(
			function(p, v) {
				p[v.cl] = (p[v.cl] || 0) + v.t;
				return p;
			}, function(p, v) {
				p[v.cl] = (p[v.cl] || 0) - v.t;
				return p;
			}, function() {
				if(graph.bydata=="car")
					return {"Grande": 0, "Media": 0, "Pequena": 0, "Minifundio": 0, "Sem CAR": 0};
				else
					return {"Desmatamento Consolidado": 0, "Desmatamento Recente": 0, "Floresta": 0, "Outros": 0};
			}
		);
		groups["uf"] = dimensions["uf"].group().reduceSum(function(d) {return +d.t;});
		groups["cl"] = dimensions["cl"].group().reduceSum(function(d) {return +d.t;});


		// totalize box 
		this.totalFocusesGroup = focuses.groupAll().reduce(
				function (p, v) {
					p.n+=v.t;
					return p;
				},
				function (p, v) {
					p.n-=v.t;
					return p;
				},
				function () { return {n:0}; }
		);
		var htmlBox="<div class='icon-left'><i class='material-icons iconmenu hackicon'>local_fire_department</i></div><span class='number-display'>";

		// build totalized Alerts box
		this.totalizedFocusesInfoBox.formatNumber(localeBR.numberFormat(','));
		this.totalizedFocusesInfoBox.valueAccessor(function(d) {return (d.n)?(d.n):(0);})
		.html({
			one:htmlBox+"<span>"+Translation[Lang.language].num_focus+" "+Translation[Lang.language].percent+"</span><br/><div class='numberinf'>%number</div></span>",
			some:htmlBox+"<span>"+Translation[Lang.language].num_focus+" "+Translation[Lang.language].percent+"</span><br/><div class='numberinf'>%number</div></span>",
			none:htmlBox+"<span>"+Translation[Lang.language].num_focus+"</span><br/><div class='numberinf'>0</div></span>"
		})
		.group(this.totalFocusesGroup);
		
		this.buildCharts(dimensions, groups);
	},
	
	buildCharts:function(dimensions,groups) {

		// to adjust title text for current dimention (prodes or car)
		graph.utils.setTitle('main',Translation[Lang.language].title_chart_main);
		
		/**
		 * Starting the bar chart of the classes by months.
		 */
		let maxDate = new Date(dimensions["ts"].top(1)[0].ts),
		minDate = new Date(dimensions["ts"].bottom(1)[0].ts);
		let dateFormat = localeBR.timeFormat('%Y/%m');

		let	barColors = this.getOrdinalColorsClasses();

		function sel_stack(i) {
			return function(d) {
				return +d.value[i];
			};
		}

		var cls=graph.config.dataConfig.legendOriginal[graph.bydata],clList=[];
		cls.forEach(function(d){
			clList.push(d);
		});
		
		var my=dimensions["my"].group().all();

		this.barMonthFiresByClass
			.height(graph.defaultHeight*0.8)
			.x(d3.scale.ordinal())
			.xUnits(dc.units.ordinal)
			.brushOn(false)
			.clipPadding(10)
			.yAxisPadding('10%')
			.yAxisLabel(Translation[Lang.language].unit_focus)
			.xAxisLabel(my[0].key + " - " + my[my.length-1].key)
			.barPadding(0.3)
			.outerPadding(0.1)
			.renderHorizontalGridLines(true)
			.title(function(d) {
				var t="";
				for(obj in d.value){
					if(d.value[obj]>0) {
						t += graph.utils.mappingClassNames(obj) +
						" - "+localeBR.numberFormat(',1f')( parseFloat( d.value[obj].toFixed(2) ) ) + " " + Translation[Lang.language].unit_focus + "\n";
					}
				}
				return Translation[Lang.language].yyyymm +": "+ d.key + "\n" + t;
			})
			.label(function(d) {
				var t=parseFloat(((d.y+d.y0)/1000).toFixed(1));
				t=(t<1?localeBR.numberFormat(',1f')(parseFloat((d.y+d.y0).toFixed(1))):localeBR.numberFormat(',1f')(t)+"k");
				return t;
			})
			.elasticY(true)
			.dimension(dimensions["my"])
			.group(groups["clt"], clList[0], sel_stack(clList[0]))
			.renderLabel(true)
			.ordinalColors((graph.bydata=='prodes')?(graph.palletBarChartProdes):(graph.palletBarChartCar))
			.margins({top: 30, right: 30, bottom: 65, left: 65})
			.legend(dc.legend().x(50).y(1).itemHeight(13).gap(7).horizontal(1).legendWidth(480).autoItemWidth(true)
				.legendText(
					function(d) {
						var t=graph.utils.mappingClassNames(d.name);
						return (d.name!='empty')?(t):(Translation[Lang.language].without);
					}
				)
			);

		delete clList[0];
		clList.forEach(function(clsName){
			graph.barMonthFiresByClass.stack(groups["clt"], ''+clsName, sel_stack(clsName));
		});

		this.barMonthFiresByClass.xAxis().ticks(groups["clt"].all().length);
		this.barMonthFiresByClass.xAxis().tickFormat(function(d) {
			return d+"";
		});
		this.barMonthFiresByClass.yAxis().ticks(5).tickFormat(function(d) {
			return localeBR.numberFormat(',1f')(d);
		});

		this.barMonthFiresByClass
			.on('preRender', function(chart) {
				chart.height(graph.defaultHeight*0.8);
				chart.legend().legendWidth(window.innerWidth/2);
			});
		
		this.barMonthFiresByClass
			.on("renderlet.a",function (chart) {
				// rotate x-axis labels
				chart.selectAll('g.x text').attr('transform', 'translate(-20,12) rotate(315)');

				if(!chart.hasFilter()){
					$('#txt9a').css('display','none');
					$('#highlight-time').css('display','');
					$('#txt9').html(Translation[Lang.language].allTime);
					$('#highlight-time').html(" " + dateFormat(minDate) + " - " + dateFormat(maxDate) );
				}else{
					$('#txt9a').css('display','');
					$('#highlight-time').css('display','none');
					$('#txt9').html(Translation[Lang.language].txt9);
				}
			});

		// end of bar chart by classes

		// build graph areas or focuses by state
		graph.utils.setTitle('state',Translation[Lang.language].title_tot_state);
		
		this.ringTotalizedByState
			.height(graph.defaultHeight)
			.innerRadius(10)
			.externalRadiusPadding(10)
			.dimension(dimensions["uf"])
			.group(this.utils.removeLittlestValues(groups["uf"]))
			.ordering(dc.pluck('value'))
			.ordinalColors((graph.bydata=='prodes')?(graph.palletPieChartProdes):(graph.palletPieChartCar))
			.legend(dc.legend().x(20).y(10).itemHeight(13).gap(7).horizontal(0).legendWidth(50).itemWidth(35));
		
		this.ringTotalizedByState
			.on('preRender', function(chart) {
				chart.height(graph.defaultHeight);
				chart.legend().legendWidth(window.innerWidth/2);
			});
		
		this.ringTotalizedByState.title(function(d) {
			let displayPercent=!graph.ringTotalizedByState.hasFilter();
			return (d.key!='empty')?(d.key + ': ' + graph.utils.numberByUnit(d.value,displayPercent)):(Translation[Lang.language].without);
		});

		this.ringTotalizedByState
			.renderLabel(true)
			.minAngleForLabel(0.7);

		this.ringTotalizedByState.label(function(d) {
			let displayPercent=!graph.ringTotalizedByState.hasFilter();
			var txtLabel=(d.key!='empty')?(graph.utils.numberByUnit(d.value,displayPercent)):(Translation[Lang.language].without);
			if(graph.ringTotalizedByState.hasFilter()) {
				var f=graph.ringTotalizedByState.filters();
				return (f.indexOf(d.key)>=0)?(txtLabel):('');
			}else{
				return txtLabel;
			}
		});

		if(!graph.ctlFirstLoading) {
			dc.override(this.ringTotalizedByState, 'legendables', function() {
				var legendables = this._legendables();
				return legendables.filter(function(l) {
					return l.data > 0;
				});
			});
		}
		
		// build top count of focuses by classes
		graph.utils.setTitle('cls', Translation[Lang.language].title_top_cls);

		this.histTopByCLs
			.height(graph.defaultHeight)
			.dimension(dimensions["cl"])
			.group(this.utils.removeLittlestValues(groups["cl"]))
			.elasticX(true)
			.ordering(function(d) {return -d.value;})
			.controlsUseVisibility(true)
			.fixedBarHeight(false)
			.ordinalColors((graph.bydata=='prodes')?(graph.palletBarChartProdes):(graph.palletBarChartCar));

		this.histTopByCLs
			.on('preRender', function(chart) {
				chart.height(graph.defaultHeight);
				chart.xAxis().ticks((chart.width()<graph.config.minWidth)?(4):(7));
			});

		this.histTopByCLs.xAxis().tickFormat(function(d) {return d;});
		this.histTopByCLs.data(function (group) {
			var fakeGroup=[];
			fakeGroup.push({key:Translation[Lang.language].without,value:0});
			return (group.all().length>0)?(group.top(10)):(fakeGroup);
		});
		this.histTopByCLs.title(function(d) {
			let displayPercent=!graph.histTopByCLs.hasFilter();
			return graph.utils.mappingClassNames(d.key) + ': ' + graph.utils.numberByUnit(d.value,displayPercent);
		});
		this.histTopByCLs.label(function(d) {
			let displayPercent=!graph.histTopByCLs.hasFilter();
			return graph.utils.mappingClassNames(d.key) + ': ' + graph.utils.numberByUnit(d.value,displayPercent);
		});
		this.histTopByCLs.colorCalculator(function(d) {
			let cc=barColors.find((aCor)=>{
				if(aCor.key==d.key) return aCor.color;
			});
			return cc.color;
		});

		// build download data
		d3.select('#download-csv-daily-all')
	    .on('click', function() {
	    	window.setTimeout(function() {
	    		var data=[];
		    	graph.data.forEach(function(d) {
		    		var o={};
		    		o.date = d.my;
				    o.class = d.cl;
			    	o.focuses = d.t;
				    o.uf = d.uf;
				    data.push(o);
				});
		    	graph.utils.downloadCSV(data,'all_');
	    	}, 200);
		});
		
		d3.select('#download-csv-daily')
	    .on('click', function() {
	    	window.setTimeout(function() {
	    		var data=[];
	    		var filteredData=graph.utils.dimensions["uf"].top(Infinity);
	    		filteredData.forEach(function(d) {
		    		var o={};
		    		o.date = d.my;
				    o.class = d.cl;
			    	o.focuses = d.t;
				    o.uf = d.uf;
				    data.push(o);
				});
		    	graph.utils.downloadCSV(data);
	    	}, 200);
	    });
		
		d3.select('#prepare_print')
	    .on('click', function() {
	    	graph.preparePrint();
	    });
		
		graph.doResize();
		window.onresize=this.utils.onResize;
		this.ctlFirstLoading=true;// to config for exec only once
	},
	preparePrint: function() {
		d3.select('#print_information').style('display','block');
		d3.select('#print_page')
	    .on('click', function() {
	    	d3.select('#print_information').style('display','none');
	    	window.print();
	    });
	},

	configurePrintKeys:function() {
		Mousetrap.bind(['command+p', 'ctrl+p'], function() {
	        console.log('command p or control p is disabled');
	        // return false to prevent default browser behavior
	        // and stop event from bubbling
	        return false;
	    });
	},
	restart() {
		graph.startLoadData();
	},
	resetFilters: function() {
		if(!graph.data) return;
		graph.utils.dimensions["my"].filterAll();
		graph.utils.dimensions["ts"].filterAll();
		graph.utils.dimensions["uf"].filterAll();
		graph.utils.dimensions["cl"].filterAll();
	},
	
};

window.onload=function(){
	if(typeof Authentication=="undefined") Authentication=false;
	graph.configurePrintKeys();
	Lang.init();
	graph.startLoadData();
	if(Authentication){
		Authentication.serverURL='/oauth-api/';
		Authentication.init(Lang.language, function(){
			graph.resetFilters();
			graph.restart();
		});
	}
};