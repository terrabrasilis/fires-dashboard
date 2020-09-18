var managerLocales={
    numberFormat:{
        "pt-br":function() {
            return localeBR.numberFormat(',.2f');
        },
        "en":function() {
            return localeUS.numberFormat(',.2f');
        }
    },
    
    labelTimeFormat:{
        "pt-br":function() {
            return localeBR.timeFormat('%d/%m/%Y');
        },
        "en":function() {
            return localeUS.timeFormat('%m/%d/%Y');
        }
    },

    fileTimeFormat:{
        "pt-br":function() {
            return localeBR.timeFormat('%d-%m-%Y');
        },
        "en":function() {
            return localeUS.timeFormat('%m-%d-%Y');
        }
    }
};