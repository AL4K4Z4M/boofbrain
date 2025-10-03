<!DOCTYPE html>
<html lang="en" class="h-full">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Boofbrain &mdash; Log in</title>
    <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
    <script src="https://cdn.tailwindcss.com?plugins=forms"></script>
    <script>
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        primary: "#58CC02",
                        surfaceLight: "#FFFFFF",
                        surfaceDark: "#1E2A32",
                        backgroundLight: "#F5FBFF",
                        backgroundDark: "#0F1A21",
                        textLight: "#0C1632",
                        textDark: "#FFFFFF",
                        mutedLight: "#6C7A89",
                        mutedDark: "#A6B4C5"
                    },
                    fontFamily: {
                        display: ["Nunito", "sans-serif"],
                        body: ["Nunito", "sans-serif"]
                    },
                    boxShadow: {
                        card: "0 24px 80px rgba(12, 22, 50, 0.15)"
                    }
                }
            }
        };
    </script>
</head>
<body class="h-full bg-backgroundLight dark:bg-backgroundDark font-body text-textLight dark:text-textDark transition-colors">
    <div class="min-h-full flex flex-col">
        <header class="px-6 md:px-10 pt-6">
            <div class="max-w-4xl mx-auto flex items-center justify-between">
                <a href="/" class="flex items-center gap-3 font-display font-extrabold text-2xl text-primary">
                    <span class="material-icons text-[32px] rounded-2xl bg-primary/10 p-2">spa</span>
                    boofbrain
                </a>
                <button id="darkModeToggle" class="rounded-full p-2 bg-surfaceLight/70 dark:bg-surfaceDark/70 shadow hover:shadow-md transition">
                    <span class="material-icons" id="darkModeIcon">light_mode</span>
                </button>
            </div>
        </header>

        <main class="flex-1 flex items-center px-6 md:px-10 py-10">
            <div class="max-w-4xl mx-auto grid lg:grid-cols-2 gap-12 w-full">
                <section class="space-y-6">
                    <span class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold uppercase text-xs tracking-[0.2em]">
                        <span class="material-icons text-sm">login</span>
                        Welcome back
                    </span>
                    <h1 class="text-4xl md:text-5xl font-extrabold leading-tight">
                        Log back into Boofbrain
                    </h1>
                    <p class="text-lg text-mutedLight dark:text-mutedDark">
                        Keep your learning streaks alive and pick up right where you left off.
                    </p>
                    <ul class="space-y-4 text-mutedLight dark:text-mutedDark">
                        <li class="flex items-start gap-3">
                            <span class="material-icons text-primary">emoji_events</span>
                            <span>Track your streaks, badges, and course completions.</span>
                        </li>
                        <li class="flex items-start gap-3">
                            <span class="material-icons text-primary">chat</span>
                            <span>Join live discussions with other curious minds.</span>
                        </li>
                        <li class="flex items-start gap-3">
                            <span class="material-icons text-primary">update</span>
                            <span>Get updates on new lessons and exclusive drops.</span>
                        </li>
                    </ul>
                    <p class="text-sm text-mutedLight dark:text-mutedDark">
                        Need an account?
                        <a href="/register" class="font-semibold text-primary hover:underline">Create one now</a>.
                    </p>
                </section>

                <section class="bg-surfaceLight dark:bg-surfaceDark/80 backdrop-blur rounded-3xl shadow-card p-6 md:p-8">
                    <form id="loginForm" class="space-y-5">
                        <div>
                            <label for="loginEmail" class="block text-sm font-semibold mb-1">Email</label>
                            <input id="loginEmail" name="email" type="email" autocomplete="email" placeholder="you@example.com" class="w-full rounded-2xl border border-slate-200/70 dark:border-slate-700 bg-white/80 dark:bg-slate-900/50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition" />
                        </div>
                        <div>
                            <label for="loginUsername" class="block text-sm font-semibold mb-1">Username</label>
                            <input id="loginUsername" name="username" type="text" autocomplete="username" placeholder="boofbrainfan" class="w-full rounded-2xl border border-slate-200/70 dark:border-slate-700 bg-white/80 dark:bg-slate-900/50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition" />
                            <p class="text-xs text-mutedLight dark:text-mutedDark mt-1">Use either your email or username to sign in.</p>
                        </div>
                        <div>
                            <label for="loginPassword" class="block text-sm font-semibold mb-1">Password</label>
                            <input id="loginPassword" name="password" type="password" autocomplete="current-password" required placeholder="••••••••" class="w-full rounded-2xl border border-slate-200/70 dark:border-slate-700 bg-white/80 dark:bg-slate-900/50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition" />
                        </div>
                        <div class="flex items-center justify-between text-sm text-mutedLight dark:text-mutedDark">
                            <label class="flex items-center gap-2">
                                <input id="rememberMe" name="rememberMe" type="checkbox" class="rounded border-slate-300 text-primary focus:ring-primary" />
                                Remember me
                            </label>
                            <a href="#" class="text-primary font-semibold hover:underline">Forgot password?</a>
                        </div>

                        <div id="loginMessage" class="hidden rounded-2xl border px-4 py-3 text-sm"></div>

                        <button type="submit" class="w-full rounded-2xl bg-primary text-white font-bold py-3.5 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition disabled:opacity-70 disabled:cursor-not-allowed">
                            Sign in
                        </button>
                    </form>
                </section>
            </div>
        </main>

        <footer class="px-6 md:px-10 pb-10 text-center text-sm text-mutedLight dark:text-mutedDark">
            &copy; 2024 Boofbrain. All rights reserved.
        </footer>
    </div>

    <script type="module" src="/js/login.js"></script>
</body>
</html>
