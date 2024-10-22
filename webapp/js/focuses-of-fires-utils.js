var utils={

  datePicker:{
    initComponent(){
      let options={
        locale: 'pt-br',
        viewMode: 'years',
        format: 'MM/YYYY',
        useCurrent: false
      };
      $('#datepickerstart').datetimepicker(options);
      $('#datepickerend').datetimepicker(options);
    },
    setInterval(dt0,dt1){
      /** dt0 is start date and dt1 is end date */
      this.setStartDate(dt0);
      this.setEndDate(dt1);
    },
    setStartDate(dt){
      /** date format in pt-br: '20/07/2017' */
      this.setProperty("start","date",dt);
    },
    setEndDate(dt){
      /** date format in pt-br: '20/07/2017' */
      this.setProperty("end","date",dt);
    },
    getStartDate(){
      return this.getProperty("start","date");
    },
    getEndDate(){
      return this.getProperty("end","date");
    },
    setStartMinDate(dt){
      /** date format in pt-br: '20/07/2017' */
      this.setProperty("start","minDate",dt);
    },
    setStartMaxDate(dt){
      /** date format in pt-br: '20/07/2017' */
      this.setProperty("start","maxDate",dt);
    },
    setEndMinDate(dt){
      /** date format in pt-br: '20/07/2017' */
      this.setProperty("end","minDate",dt);
    },
    setEndMaxDate(dt){
      /** date format in pt-br: '20/07/2017' */
      this.setProperty("end","maxDate",dt);
    },
    setProperty(which, property, val){
      /** which is 'start' or 'end' */
      $('#datepicker'+which).datetimepicker(property,val);
    },
    getProperty(which, property){
      /** which is 'start' or 'end' */
      return $('#datepicker'+which).datetimepicker(property);
    }
  },
  /**
   * Remove empty entries from group
   * @param {crossfilter group} source_group 
   * @returns A fake group without zeroes
   */
  removeEmptyBins:function(source_group) {
    return {
      all:function () {
        return source_group.all().filter(function(d) {
          return ((v)=>{
            for(let p in v) {if(v[p]>0) return true;}
            return false;
          })(d.value);
        });
      }
    };
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

  mappingClassNames: function(cl) {
    if(graph.config.dataConfig.legendOriginal===undefined || !graph.config.dataConfig.legendOriginal[graph.bydata]) {
      return cl;
    }
    var l = graph.config.dataConfig.legendOriginal[graph.bydata].length;
    for (var i = 0; i < l; i++) {
      if(graph.config.dataConfig.legendOriginal[graph.bydata][i].toLowerCase()===cl.toLowerCase()) {
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
}