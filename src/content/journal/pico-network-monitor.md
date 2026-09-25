If you vibe code, you probably know this routine. You give your AI agent a big task, leave your desktop running at home, and head out. From your phone you check in, send a new prompt, and watch it build while you're on the bus or at class. Your home computer has quietly become a server that works while you don't.

But there's a weak spot nobody talks about: your home internet. If the Wi-Fi drops at 2 PM, your agent stops, your remote session goes dead, and you won't find out until you get home and see that nothing happened for five hours. And when a session does fail, you're left guessing. Was it the agent? My code? Or just my internet?

I wanted to answer that last question for good. So I built a small device that watches my home internet 24/7 and shows me its health from anywhere.

## The idea

My mentor suggested I build something to monitor my network, and the problem was already bugging me. I took a Raspberry Pi Pico W, a $6 microcontroller with Wi-Fi, and wrote MicroPython code to measure my connection every 10 seconds:

- **Wi-Fi signal (RSSI):** how strong the Wi-Fi is where the device sits
- **Latency:** how long a round trip to the internet takes
- **Jitter:** how steady that latency is
- **Packet loss:** how often connection attempts fail
- **Uptime:** how long the device has been running

Together, these explain almost any "why does my internet feel bad?" moment. Speed tests tell you how fast your connection *can* be. These numbers tell you how it's *actually* behaving, minute by minute.

## Version one worked, only in my room

The first version ran a small web server right on the Pico. It measured the network and served a dashboard page, and it worked. But only for devices on my home Wi-Fi.

I had pushed all the code to GitHub and assumed that meant it was "online." It didn't. GitHub stored my code; it didn't run it. The moment I left the house, the dashboard was unreachable, which made it useless for the exact situation I built it for.

## Finding the real problem

My first thought was "I need to deploy this." But that wasn't the real problem. The real problem was that a tiny microcontroller can't safely serve a website to the whole internet, and my home router wouldn't let strangers reach it anyway.

Once I named the problem correctly, the solution got simple. I split the job into three pieces:

1. **Measure:** the Pico stops being a server and becomes a sensor. Every 10 seconds it measures and sends its readings out.
2. **Store:** the readings go to a free, public feed on Adafruit IO, a cloud service built for small devices.
3. **Display:** the dashboard becomes a single static page on GitHub Pages that reads the latest value from the feed.

```
Pico W (home)  ──sends──▶  Adafruit IO (cloud)  ◀──reads──  Dashboard (GitHub Pages)
```

My favorite part is that there's no backend to run and nothing to pay for. The Pico pushes data, and the page pulls it. If the internet at home goes down, the Pico can't send anything, so when the newest reading is more than a minute old, the dashboard switches to **"Offline."** That's the signal a remote vibe coder actually needs.

Along the way I made a real mistake: my Wi-Fi password lived in a `config.py` file in my project. I moved it out of Git and added a `config.example.py` template instead, so anyone can use the code without seeing my secrets. Secrets management matters, even on a $6 board.

## When my monitor lied to me

Once everything was running, I noticed packet loss always showed 0%. Looking closer, I found why: the Pico ran just one connection test per reading, so packet loss could only ever be 0% or 100%. And a 100% reading could never reach the cloud anyway, because the internet was down.

So I changed it to run five tests per reading and count how many fail. Immediately, the dashboard showed **40% packet loss** and latency over **a full second**.

My internet was fine. Videos played and pages loaded. The monitor was wrong.

It turned out the problem was the Pico itself. Its Wi-Fi chip saves power by napping between transmissions, and any test that landed during a nap came back slow or failed. I turned power saving off (the Pico lives on a charger, so it doesn't need it) and added a short pause between tests. The readings settled at **11–14 ms with 0% loss**, which matched reality.

This was the most important lesson of the project. A monitoring tool is only useful if you check it against reality. Mine was confidently wrong until I did. If I had trusted the numbers, I would have blamed my internet provider for a bug in my own code.

## The final picture

![Pico W network monitor dashboard](./pico-dashboard.png)

Now it sits on a charger at home, checking my internet every 10 seconds. Before I send a long task to my desktop from my phone, I glance at the dashboard. Green means go. Amber means the connection is shaky, so I keep tasks short. Offline means I know exactly why my session died, and it's not my code.

Want to build your own? The code and step-by-step setup guide are on GitHub: [github.com/aabdullakh/pico_internet_monitor](https://github.com/aabdullakh/pico_internet_monitor)
