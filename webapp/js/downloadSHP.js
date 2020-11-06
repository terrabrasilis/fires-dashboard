let downloadCtrl={

	project:null,
	
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
			this.project="active-fires";
		}
	}
};