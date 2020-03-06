//stopwatch config 
class createStopWatch {
    constructor(minute, second, millisec) {

        let mytime = 0
        let interval
        let myoffset

        this.isStart = false

        function formatter(mils) {
            let timing = new Date(mils)
            //let hours = timing.getHours().toFixed(2)
            let minutes = timing.getMinutes().toString()
            let seconds = timing.getSeconds().toString()
            let milli = Math.floor(timing.getMilliseconds() / 10).toString()

            if (minutes.length < 2)
                minutes = "0" + minutes

            if (seconds.length < 2)
                seconds = "0" + seconds

            while (milli.length < 2)
                milli = "0" + milli

            //return minutes + " : " + seconds + " : " + milli
            return { minutes, seconds, milli }
        }

        function update() {
            //console.log(this)
            if (this.isStart) {
                mytime += delta()
            }
            let format = formatter(mytime)
            minute.textContent = format.minutes
            second.textContent = format.seconds
            millisec.textContent = format.milli
        }

        update = update.bind(this)

        function delta() {
            let now = Date.now()
            let timePassed = now - myoffset
            myoffset = now

            return timePassed
        }

        this.start = function () {
            if (!this.isStart) {
                interval = setInterval(update, 10)
                myoffset = Date.now()
                this.isStart = true
            }
        }

        this.stop = function () {
            if (this.isStart) {
                clearInterval(interval)
                interval = null
                this.isStart = false
            }
        }

        this.reset = function () {
            if (!this.isStart) {
                mytime = 0
                update()
            }
        }
    }
}



const _minute = document.querySelector("[data-time='minute']")
const _second = document.querySelector("[data-time='second']")
const _milli = document.querySelector("[data-time='milli']")

const myBtn = document.querySelector("[id='record']")

const stopIt = new createStopWatch(_minute, _second, _milli)

const sleep = time => new Promise(resolve => setTimeout(resolve, time))

let oldItems = JSON.parse(localStorage.getItem('savedItems')) || [];

function addTodosToPage() {
    let ul = document.getElementById("items");
    let listFragment = document.createDocumentFragment();
    if (oldItems.length > 0) {
        for (var i = 0; i < oldItems.length; i++) {
            var oldItem = oldItems[i];
            var li = createNewTodo(oldItem);
            listFragment.appendChild(li);
        }
    } else {
        showMessage(listFragment)
    }
    ul.appendChild(listFragment);
    //localStorage.clear()
}

function showMessage(fragment) {
    let placeholder = document.createElement("span")
    placeholder.classList.add("content-list--placeholder")
    placeholder.textContent = "No saved recordings. Press record to start one!"
    fragment.appendChild(placeholder)
}

function addTodoToPage(item) {
    const placeholder = document.querySelector(".content-list--placeholder")
    placeholder && placeholder.remove()
    let ul = document.getElementById("items");
    let li = createNewTodo(item);
    ul.insertBefore(li, ul.firstChild);
}

function createNewTodo(item) {
    let li = document.createElement("li");
    li.classList.add("content-list--listitem")

    let div = document.createElement("div")
    div.classList.add("content-list--listitem-content")

    let audio = document.createElement("audio")
    audio.classList.add("content-list--listitem-audio")
    audio.controls = true
    audio.autoplay = false
    audio.src = item.link

    let title = document.createElement("span");
    title.classList.add("content-list--listitem-title")
    title.textContent = item.title

    div.appendChild(title)
    div.appendChild(audio)

    let downloadbtn = document.createElement("a")
    let span = document.createElement("span")
    span.classList.add("content-list--listitem-button-text")
    span.innerHTML = '<small class="fas fa-download"></small>'

    downloadbtn.classList.add("content-list--listitem-button")
    downloadbtn.href = item.link
    downloadbtn.download = item.title + ".webm"
    downloadbtn.appendChild(span)

    let delBtn = document.createElement("button")
    delBtn.classList.add("content-list--listitem-delete")
    delBtn.innerHTML = `<i class="fas fa-trash"></i>`

    let ul = document.getElementById("items");
    let listFragment = document.createDocumentFragment();

    delBtn.onclick = () => {
        
        let spliced = oldItems.findIndex(x => x.title === item.title)
        oldItems.splice(spliced, 1)

        localStorage.setItem('savedItems', JSON.stringify(oldItems));

        li.classList.add("del") 
        setTimeout(()=>{
            li && ul.removeChild(li)
            if(oldItems.length === 0) {
                showMessage(listFragment) 
                ul.appendChild(listFragment)
            }
        },500)
            
            //showMessage(listFragment)
            //ul.appendChild(listFragment)
    }

    li.appendChild(downloadbtn)
    li.appendChild(div);
    li.appendChild(delBtn)

    return li;
}

function resetPage() {
    localStorage.clear()
    location.reload()
}

window.onload = () => {
    addTodosToPage()
    // let types = ["video/webm",
    //     "audio/webm",
    //     "audio/webm\;codecs=opus",
    //     "audio/webm\;codecs=opus",
    //     "audio/mp3\;codecs=opus",
    //     "audio/mp3",
    // ];

    if ("mediaDevices" in navigator) {
        navigator.permissions.query({
            name: 'microphone'
        }).then((status) => {
            //console.log(status)
            if (status.state == "granted") {
                //console.log("hurray")
            }
        })

    }

    navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
            const options = {
                audioBitsPerSecond: 128000,
                mimeType: 'audio/o'
            }

            const _recorder = new MediaRecorder(stream)

            myBtn && myBtn.addEventListener("change", function (e) {
                const context = document.querySelector("[id='context']")
                if (e.target.checked && !stopIt.isStart) {
                    document.body.classList.add("show")
                    context.innerHTML = `<small class="fas fa-stop"></small>`
                    _recorder.start()
                    stopIt.start()
                }
                else {
                    document.body.classList.remove("show")
                    context.innerHTML = `<small class="fas fa-play"></small>`
                    _recorder.stop()
                    stopIt.stop()
                }
            })

            const events = []
            _recorder.ondataavailable = ({ data }) => {
                //console.log("DATA: ", data)
                events.push(data)
            }

            _recorder.onstop = (e) => {
                const clipName = prompt("Give audio file a name").trim()
                stopIt.reset()
                //console.log(events)
                const chunks = new Blob(events)
                //console.log("AUDIO CHUNKS: ", chunks)
                const audioURL = URL.createObjectURL(chunks)
                //console.log("AUDIO LINK: ", audioURL)
                let newObj = {
                    'title': clipName,
                    'link': audioURL
                }
                oldItems.unshift(newObj);

                localStorage.setItem('savedItems', JSON.stringify(oldItems));
                //location.reload()
                addTodoToPage(newObj)

                //console.log(JSON.parse(localStorage.getItem("savedItems")))
            }
        })

    //console.log(JSON.parse(localStorage.getItem("savedItems")))
}







