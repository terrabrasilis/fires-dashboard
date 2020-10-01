var graph={
		
	jsonData:[],
	totalRows:0,
	bydata:"prodes",// default on UI
	config:{},
	selectedFilters:{},
	ctlFirstLoading:false,
	cssDefault:true,
	
	totalizedFocusesInfoBox:undefined,// totalized focuses info box
	barMonthFiresByClass: null,
	ringTotalizedByState:undefined,
	histTopByCLs:undefined,
	
	histogramColor: ["#0000FF","#57B4F0"],
	darkHistogramColor: ["#ffd700","#fc9700"],
	pallet: ["#FF0000","#FF6A00","#FF8C00","#FFA500","#FFD700","#FFFF00","#DA70D6","#BA55D3","#7B68EE"],
	darkPallet: ["#FF0000","#FF6A00","#FF8C00","#FFA500","#FFD700","#FFFF00","#DA70D6","#BA55D3","#7B68EE"],
	barTop10Color: "#b8b8b8",
	darkBarTop10Color: "#232323",

	/**
	 * Load configuration file before loading data.
	 */
	setConfigurations: function(conf) {
		if(conf) {
			graph.pallet=conf.pallet?conf.pallet:graph.pallet;
			graph.darkPallet=conf.darkPallet?conf.darkPallet:graph.darkPallet;
			graph.histogramColor=conf.histogramColor?conf.histogramColor:graph.histogramColor;
			graph.darkHistogramColor=conf.darkHistogramColor?conf.darkHistogramColor:graph.darkHistogramColor;
			graph.barTop10Color=conf.barTop10Color?conf.barTop10Color:graph.barTop10Color;
			graph.darkBarTop10Color=conf.darkBarTop10Color?conf.darkBarTop10Color:graph.darkBarTop10Color;
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
			graph.loadUpdatedDate();
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
			graph.jsonData = data;
			graph.normalizeData();
			return true;
		}
	},

	startLoadData: function() {

		var afterLoadConfiguration=function(cfg) {
			graph.displayWaiting();
			var configDashboard={resizeTimeout:0, minWidth:250, dataConfig:cfg};
			var dataUrl = "./data/focuses-of-fires-"+graph.bydata+".json";
			var afterLoadData=function(json) {
				Lang.apply();
				if(!json || !json.features) {
					graph.displayWarning(true);
				}else{
					graph.init(configDashboard, json.features);
				}
			};
			d3.json(dataUrl)
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

	loadUpdatedDate: function() {
		var url="./data/updated-date.json";

		d3.json(url, (json) => {
			var dt=new Date(json.features[0].properties.updated_date+'T21:00:00.000Z');
			d3.select("#updated_date").html(' '+dt.toLocaleDateString());
		});
	},
	
	setDataDimension: function(d) {
		this.bydata=d;
		this.restart();
	},
	
	// resetFilters:function() {
	// 	graph.barMonthFiresByClass.filterAll();
	// 	graph.ringTotalizedByState.filterAll();
	// 	graph.histTopByCLs.filterAll();
	// 	SearchEngine.applyCountyFilter();
	// },

	utils:{

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
			var dim=Translation[Lang.language].num_focus;
			var unit=Translation[Lang.language].unit_focus;
			str=str.replace(/%dim%/gi,function(x){return (x=='%Dim%'?dim.charAt(0).toUpperCase()+dim.slice(1):dim);});
			str=str.replace(/%unit%/gi,function(x){return (x=='%Unit%'?unit.charAt(0).toUpperCase()+unit.slice(1):unit);});
			return str;
		},
		
		numberByUnit:function(num,displayPercent=true) {
			let percent=(num*100/graph.totalFocusesGroup.value().n).toFixed(1)+"%";
			let nf=localeBR.numberFormat(',')
			return "\n"+nf(num.toFixed(0)) +" "+ graph.utils.wildcardExchange(" %unit%")+ ((displayPercent)?("\n("+percent+")"):(""));
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
		this.jsonData.forEach(function(d) {
			// "properties":{"y":2020,"m":9,"c":"Desmatamento Consolidado","e":"ACRE","t":722}}
			let mm=(+d.properties.m<10)?("0"+d.properties.m):(d.properties.m);
			var o={uf:d.properties.e,cl:d.properties.c,my:d.properties.y+"/"+mm,t:d.properties.t};
			var auxDate = new Date(d.properties.y+'-'+ mm + '-01T04:00:00.000Z');
			o.ts = auxDate.getTime();
			json.push(o);
		});
		
		this.jsonData=json;
		delete json;
	},
	
	build:function() {
		
		let dimensions=[];
		// set crossfilter
		let focuses = crossfilter(this.jsonData);
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
				return {};
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
		var htmlBox="<div class='icon-left'><i class='fa fa-fire fa-2x hackicon' aria-hidden='true'></i></div><span class='number-display'>";

		// build totalized Alerts box
		this.totalizedFocusesInfoBox.formatNumber(localeBR.numberFormat(','));
		this.totalizedFocusesInfoBox.valueAccessor(function(d) {return (d.n)?(d.n):(0);})
		.html({
			one:htmlBox+"<span>"+Translation[Lang.language].num_focus+" (100%)</span><br/><div class='numberinf'>%number</div></span>",
			some:htmlBox+"<span>"+Translation[Lang.language].num_focus+" (100%)</span><br/><div class='numberinf'>%number</div></span>",
			none:htmlBox+"<span>"+Translation[Lang.language].num_focus+"</span><br/><div class='numberinf'>0</div></span>"
		})
		.group(this.totalFocusesGroup);
		
		this.buildCharts(dimensions, groups);
	},
	
	buildCharts:function(dimensions,groups) {
		
		/**
		 * Starting the bar chart of the classes by months.
		 */
		let auxClt=[],auxT=[];
		groups["clt"].all().forEach(function(y){
			auxClt.push(+y.key);
			auxT.push(y.value);
		});

		function sel_stack(i) {
			return function(d) {
				return +d.value[i];
			};
		}

		var cls=dimensions["cl"].group().all(),clList=[];
		cls.forEach(function(d){
			clList.push(d.key);
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
						t += obj +
						" ("+localeBR.numberFormat(',1f')( parseFloat( d.value[obj].toFixed(2) ) ) + " " + Translation[Lang.language].unit_focus + ")\n";
					}
				}
				return d.key + "\n" + t;
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
			.ordinalColors((graph.cssDefault)?(graph.pallet):(graph.darkPallet))
			.margins({top: 30, right: 30, bottom: 60, left: 65})
			.legend(dc.legend().x(50).y(1).itemHeight(13).gap(7).horizontal(1).legendWidth(480).autoItemWidth(true));

		delete clList[0];
		clList.forEach(function(uf){
			graph.barMonthFiresByClass.stack(groups["clt"], ''+uf, sel_stack(uf));
		});

		this.barMonthFiresByClass.xAxis().ticks(auxClt.length);
		this.barMonthFiresByClass.xAxis().tickFormat(function(d) {
			return d+"";
		});
		this.barMonthFiresByClass.yAxis().tickFormat(function(d) {
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
				chart.selectAll('g.x text')
					.attr('transform', 'translate(-15,7) rotate(315)');
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
			.ordinalColors((graph.cssDefault)?(graph.pallet):(graph.darkPallet))
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
		
		// build top areas or focuses by ucs
		graph.utils.setTitle('ucs', Translation[Lang.language].title_top_uc);

		this.histTopByCLs
			.height(graph.defaultHeight)
			.dimension(dimensions["cl"])
			.group(this.utils.removeLittlestValues(groups["cl"]))
			.elasticX(true)
			.ordering(function(d) { return d.cl; })
			.controlsUseVisibility(true)
			.fixedBarHeight(false)
			.ordinalColors([(graph.cssDefault)?(graph.barTop10Color):(graph.darkBarTop10Color)]);
			//.ordinalColors(["#FF4500","#FF8C00","#FFA500","#FFD700","#FFFF00","#BA55D3","#9932CC","#8A2BE2","#3182BD","#6BAED6"]);

		this.histTopByCLs
			.on('preRender', function(chart) {
				chart.height(graph.defaultHeight);
				chart.xAxis().ticks((chart.width()<graph.config.minWidth)?(4):(7));
			});

		// this.histTopByCLs
		// 	.on('preRedraw', function (chart) {
		// 		if(chart.data().length > 5){
		// 			chart.fixedBarHeight(false);
		// 		}else{
		// 			chart.fixedBarHeight( parseInt((chart.effectiveHeight()*0.7)/10) );
		// 		}
		// 	});

		this.histTopByCLs
			.on("renderlet.a",function (chart) {
				var texts=chart.selectAll('g.row text');
				var rankMun=function() {
					var allTop=groups["cl"].top(Infinity);
					var ar={};
					allTop.forEach(function(k,i){ar["\""+k.key+"\""]=(i+1);});
					return ar;
				};
				texts[0].forEach(function(t){
					var p=(rankMun()["\""+t.innerHTML.split(":")[0]+"\""])?(rankMun()["\""+t.innerHTML.split(":")[0]+"\""]+'º - '):('');
					t.innerHTML=p+t.innerHTML;
				});
			});
			
		this.histTopByCLs.xAxis().tickFormat(function(d) {return d;});
		this.histTopByCLs.data(function (group) {
			var fakeGroup=[];
			fakeGroup.push({key:Translation[Lang.language].without,value:0});
			return (group.all().length>0)?(group.top(10)):(fakeGroup);
		});
		this.histTopByCLs.title(function(d) {
			let displayPercent=!graph.histTopByCLs.hasFilter();
			return d.key + ': ' + graph.utils.numberByUnit(d.value,displayPercent);
		});
		this.histTopByCLs.label(function(d) {
			let displayPercent=!graph.histTopByCLs.hasFilter();
			return d.key + ': ' + graph.utils.numberByUnit(d.value,displayPercent);
		});

		// build download data
		d3.select('#download-csv-daily-all')
	    .on('click', function() {
	    	graph.utils.download=function(data) {
		        var blob = new Blob([d3.csv.format(data)], {type: "text/csv;charset=utf-8"});
		        saveAs(blob, downloadCtrl.getProject()+'-month-'+downloadCtrl.getDownloadTime()+'.csv');
	    	};
	    	window.setTimeout(function() {
	    		var data=[];
		    	graph.jsonData.forEach(function(d) {
		    		var o={};
		    		var dt = new Date(d.timestamp);
		    		o.viewDate = dt.toLocaleDateString();
		    		//o.mes = dt.getMonth()+1;
		    		//o.ano = dt.getFullYear();
		    		//o.totalAlertas = d.k;
				    o.areaMunKm = parseFloat(d.areaKm.toFixed(4));
			    	o.areaUcKm = parseFloat(d.areaUcKm.toFixed(4));
				    o.cl = ((d.cl!='null')?(d.cl):(''));
				    o.uf = d.uf;
				    o.municipio = d.county;
				    data.push(o);
				});
		    	graph.utils.download(data);
	    	}, 200);
		});
		
		d3.select('#download-csv-daily')
	    .on('click', function() {
	    	graph.utils.download=function(data) {
		        var blob = new Blob([d3.csv.format(data)], {type: "text/csv;charset=utf-8"});
		        saveAs(blob, downloadCtrl.getProject()+'-daily-'+downloadCtrl.getDownloadTime()+'.csv');
	    	};
	    	window.setTimeout(function() {
	    		var data=[];
	    		var filteredData=graph.utils.dimensions["uf"].top(Infinity);
	    		filteredData.forEach(function(d) {
		    		var o={};
		    		var dt = new Date(d.timestamp);
		    		o.viewDate = dt.toLocaleDateString();
				    o.areaMunKm = parseFloat(d.areaKm.toFixed(4));
			    	o.areaUcKm = parseFloat(d.areaUcKm.toFixed(4));
				    o.cl = ((d.cl!='null')?(d.cl):(''));
				    o.uf = d.uf;
				    o.municipio = d.county;
				    data.push(o);
				});
		    	graph.utils.download(data);
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
	}
	
};

window.onload=function(){
	graph.configurePrintKeys();
	Lang.init();
	graph.startLoadData();
};