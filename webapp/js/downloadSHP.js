let downloadCtrl={

	project:null,
	homologation:"",
	serviceBaseUrl:"/file-delivery",

	getFileDeliveryURL() {
		this.inferHomologationByURI();
		this.serviceBaseUrl=this.inferLocalhost()+"/"+this.homologation+"file-delivery";
		return this.serviceBaseUrl;
	},
	
	getDownloadTime() {
		let dt=new Date();
		dt=dt.toLocaleDateString() +'-'+ dt.toLocaleTimeString();
		dt=dt.split('/').join('-');
		return ''+dt;
	},

	getProject() {
		this.inferProjectByURI();
		return this.project;
	},

	inferProjectByURI() {
		var URL=document.location.href;
		if(URL.includes("fires")){
			this.project="dashboard-fires";
		}
	},
	
	inferHomologationByURI() {
		var URL=document.location.href;
		if(URL.includes("homologation")){
			this.homologation="homologation/";
		}
	},

	inferLocalhost() {
		let orig=document.location.origin;
		let u="";
		if(orig.includes('localhost') || orig.includes('127'))
			u="http://terrabrasilis.dpi.inpe.br";

		return u;
	},
};