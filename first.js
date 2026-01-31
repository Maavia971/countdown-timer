(function(){

   /*  element selection helpers  */
    const el = id => document.getElementById(id);
    const daysEl = el("days"), hoursEl = el("hours"), minutesEl = el("minutes"),  secondsEl = el("seconds");
    const targetInput = el("target");
    const startBtn = el("start"), pauseBtn = el("pause"), resetBtn = el("reset");
    const statusText = el("statusText");
    const presetYear = el("preset-year");
    const exportLinkdinBtn = el("export-link");
    const downloadIcsBtn = el("download-ics");

  /* initial variables */
    let interValId = null;
    let targetTime = null; //times tamp in ms
    let pause = false;

 /*   utility functions */
    function pad (num) {
        return String(num).padStart(2,"0") 
    }

    function msToParts(ms){
        if(ms < 0) ms = 0;
        const sec = Math.floor(ms/1000);
        const days = Math.floor(sec/86400);
        const hours = Math.floor((sec%86400)/3600);
         const mintues = Math.floor((sec%3600)/60);
         const seconds = sec % 60; return {
            days, hours, mintues, seconds
         };
    }
    function updateDisplay(ms) {
        const p = msToParts(ms);
        daysEl.textContent = pad(p.days);
        hoursEl.textContent = pad(p.hours);
        minutesEl.textContent = pad(p.mintues);
        secondsEl.textContent = pad(p.seconds);

    }
    //  /* Timer core function  */
    function tick() {
        if(!targetTime) return;
        const now = Date.now();
        const diff = targetTime - now;
        if (diff <= 0){
            updateDisplay(0);
            stopInterval();
            statusText.textContent = "Completed";
            announceCompletion();
            return;
        }
        updateDisplay(diff);
    }
    function startInterval(){
        stopInterval();
        interValId = setInterval(tick,1000);
        tick();
    }
    function stopInterval(){
        if (interValId){
            clearInterval(interValId);
            interValId = null
        }
    }
        function announceCompletion(){
            const a = document.createElement("div");
            a.setAttribute("role","status");

            a.style.position = "absolute"; a.style.left="-9999px";
            a.textContent = "Countdown completed";
            document.body.appendChild(a);
            setTimeout(() =>a.remove(),1500);
        }
        
            /*  Control Buttons
                start button */
            startBtn.addEventListener("click",()=>{
            const value = targetInput.value;
            if (value){
                const selected = new Date(value);

                if (Number.isNaN(selected.getTime())){
                    alert("invalid date"); return
                }
                targetTime = selected.getTime();
            }
            if(!targetTime){
                alert("please set a target date/time or choose a preset."); return }
           
            pause = false;
            statusText.textContent = "Running";
            startInterval();
        });

          /* pause button  */
        pauseBtn.addEventListener("click", () =>{
            if (!targetTime) return;
            if(pause){  //resume
             pause = false;
             statusText.textContent = "Running";
             startInterval();
            }else{
                stopInterval();
                const now = Date.now();
                const remaining = targetTime-now;
                targetTime = now + remaining;
                pause = true;
                statusText.textContent = "paused";
            }
        });

            /* reset button  */
        resetBtn.addEventListener("click", () =>{
            stopInterval();
            targetTime = null;
            pause = false;
            targetInput.value = "";
            updateDisplay(0);
            statusText.textContent = "Idle";
        });

            /*  preset buttons  */
        document.querySelectorAll("[data-add]").forEach(btn =>{
            btn.addEventListener("click", () =>{
        const seconds = Number(btn.getAttribute("data-add")) || 0;
        const t = new Date(Date.now() + seconds*1000);
        targetInput.value = toDateTimeLocalValue(t);
            })
        });

           /* New Year Preset  */
        presetYear.addEventListener("click", () =>{
            const now = new Date();
            const nextYear = now.getFullYear() + 1;
            const newYear = new Date(`${nextYear}-01-01T00:00:00`);
            targetInput.value = toDateTimeLocalValue(newYear);
        });
        
        /* Export/Share Features  
           Copy Shareable Link  */
        exportLinkdinBtn.addEventListener("click", () =>{
            if(!targetInput.value){
                alert("Set a target first"); return
            }
            const url = new URL(location.href);
            url.hash = "target=" + encodeURIComponent(targetInput.value);

            navigator.clipboard.writeText(url.toString()).then(() =>{
                alert("Shareable link copied to the clipboard");
            }).catch(() => alert("Copy failed - allow clipboard permission"));
        });

        /* Download .ics File (Calendar) */
        downloadIcsBtn.addEventListener("click", () =>{
            if(!targetInput.value){
                alert("Set a target first"); return
            }
            const dt = new Date(targetInput.value);
            const uid = "countdown-" + Date.now();
            function fmtICS(d) {
                return d.toISOString().replace(/[-:]/g,"").split(".")[0] + "Z";
            
            }
            const ics = [
                "BEGIN:VCALENDAR",
                "VERSION:2.0",
                "PRODID:-//CountdownTimer//EN",
                "BEGIN:VEVENT",
                "UID:" + uid,
                "DTSTAMP:" + fmtICS(new Date()),
                "DSTART:" + fmtICS(dt),
                "SUMMARY:Countdown target",
                "END:VEVENT", "END:VCALENDAR"  ].join ("\r\n");
                const blob = new Blob([ics], {type:"text/calendar"});
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = "countdown.ics";
                document.body.appendChild(link);
                link.click();
                link.remove();
          });

        /*  Load Existing Countdown from URL  */
        (function hydrateFromHash() {
            try{
                const hash = location.hash.slice(1);
                if(!hash) return;
                const params = newURLSearchParams(hash);
                const t = params.get("target");
                if(t){
                    targetInput.value = decodeURIComponent(t);
                }
            }catch(e){ /* ignore */}
        })();
      /*  Convert Date  → Input Format  */
       function toDateTimeLocalValue(date){
        const pad2 = n=>String(n).padStart(2,"0");
        const yyyy = date.getFullYear();
        const mm = pad2(date.getMonth()+1);
        const dd = pad2(date.getDate());
        const hh = pad2(date.getHours());
        const min = pad2(date.getMinutes());
        return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
       }

     /*  Initial Display And   OPtional :Keyboard Shortcuts */   
     updateDisplay(0);
                                         
     document.addEventListener("keydown",(e) =>{
        if(e.key === "" && document.activeElement.tagName !== "INPUT"){
            e.preventDefault();
            if(interValId)
            {pauseBtn.click(); } else{
                startBtn.click();
            }
        }
     });
        
    

}) ();