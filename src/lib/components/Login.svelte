<script lang="ts">
  import { onMount } from "svelte";
  import { fade, slide } from "svelte/transition";
  import { toastr } from "$lib/scripts/ui/toastr";
  import { capitalizeFirstLetters, ucwords } from "$lib/scripts/utils";
  import { Button } from "./ui/button";
  import Input from "./ui/input/input.svelte";

  interface Props {
    gs: GlobalState;
    _success: () => void;
  }
  const { gs, _success }: Props = $props();

  let loading = $state(false);
  let error: string | null = $state(""); // For rust errors like 'invalid-creds'
  let user: string = $state("");
  let pass: string = $state("");
  let cPass: string = $state(""); // For password confirmation

  let form: HTMLFormElement | null = $state(null);
  let nForm: HTMLFormElement | null = $state(null); // For new user registration
  let dodoAction: "plop" | "slop" = $state("plop");
  // Create an array of image paths
  const images = Array.from({ length: 27 }, (_, i) => `welcome${i === 0 ? "" : i}.png`);
  let randomImage = $state("");
  //Yes. It's random shifting is intentional. It is a feature, not a bug.
  let arrayOfBullshit = [
    "Welcome to CRL",
    "Common Rectal Lab",
    "Clean Resolute Laxative",
    "Chill, Relax, Lube",
    "Cuddle Random Liverpudlians.",
    "CEE, REE, Leave... aww... 😖",
    "Ceremonially Relative Lactation",
    "Ceremonial Rebellious Librarian",
    "Cuddly Raccoon Lovers",
    "Canae Read? Leave!",
    "Come Read to Leonardo",
    "Combustion Reaction Lab",
    "Council of Reactive Libertarians",
    "Council of Radical Left-handers",
    "CRL",
    "CEE-RA-L",
    "CEREAL",
    "SERIAL",
    "WEAR SUNSCREEN",
    "Cub-Ra-Libre",
    "Collection of Redundant LLMs",
  ];
  // Select a random image
  onMount(() => {
    randomImage = images[Math.floor(Math.random() * images.length)];
  });

  async function tryLogin(event: Event) {
    event.preventDefault();
    loading = true;
    error = null;
    try {
      if (!form?.checkValidity()) {
        form?.reportValidity();
        throw new Error("Please fill in all required fields.");
      }
      if (user.length < 3 || pass.length < 3) {
        throw new Error("Username and password must be at least 3 characters long.");
      }
      const formData = new FormData();
      formData.append("user", user.trim().toLowerCase());
      formData.append("pass", pass.trim());
      //Try login here //TODO: Rust command here.
      /*const data = await response.json();
		console.log("Login response:", data);
		if (!response.ok || data?.error || data?.status !== 200 || data?.type === "failure") {
			if (typeof data.data === "string") {
				const errorData = JSON.parse(data.data)?.[1];
				console.error("Login error:", errorData);
				throw new Error(errorData || "Login failed");
			}
			throw new Error("Login failed");
		}
    else if (data?.status === 200 && data?.type === "success") {
        //TODO: Success
      //goto("/CRL", { replaceState: true });
      return;
    }*/
      //TODO: Set global state here
      gs.authenticated = true;
      _success();
      return;
    } catch (err: any) {
      console.error("Login failed:", err);
      // Try to get the error message from err.message, err.error, or the string itself
      const msg = err?.message || err?.error || err || "Login failed";
      toastr({ message: ucwords(msg), type: "error" });
      error = msg;
    } finally {
      loading = false;
    }
  }
  async function tryRegister(event: Event) {
    event.preventDefault();
    loading = true;
    error = null;
    try {
      if (!nForm?.checkValidity()) {
        nForm?.reportValidity();
        throw new Error("Please fill in all required fields.");
      }
      if (pass !== cPass) {
        throw new Error("Passwords do not match.");
      }
      if (user.length < 3 || pass.length < 3 || cPass.length < 3) {
        throw new Error("Username and password must be at least 3 characters long.");
      }
      //if user includes spaces, glyphs
      if (/\s/.test(user) || /[!@#$%^&*(),.?":{}|<>]/.test(user.trim())) {
        throw new Error("Username cannot contain spaces or special characters.");
      }
      const formData = new FormData();
      formData.append("user", user.trim().toLowerCase());
      formData.append("pass", pass.trim());

      const response = await fetch("?/register", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await response.json();
      console.log("Registration response:", data);
      if (!response.ok || data?.error || data?.status !== 200 || data?.type === "failure") {
        if (typeof data.data === "string") {
          const errorData = JSON.parse(data.data)?.[1];
          console.error("Registration error:", errorData);
          throw new Error(errorData || "Registration failed");
        }
        throw new Error("Registration failed");
      } else if (data?.status === 200 && data?.type === "success") {
        //goto("/CRL", { replaceState: true }); //prevent back button history
        //TODO: Success
        return;
      }
    } catch (err: any) {
      console.error("Registration failed:", err);
      // Try to get the error message from err.message, err.error, or the string itself
      const msg = err?.message || err?.error || err || "Registration failed";
      toastr({ message: capitalizeFirstLetters(msg), type: "error" });
      error = msg;
    } finally {
      loading = false;
    }
  }
</script>

<div class="flex flex-1 flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
  <div class="mx-auto w-full max-w-sm lg:w-96">
    <div>
      <h2 class="mt-6 text-2xl font-light tracking-tight flex items-center">
        <img src="/static/crl-images/icon_logo.png" class="align-center w-12" alt="Welcome to CRL" />
        &nbsp; {arrayOfBullshit[Math.floor(Math.random() * arrayOfBullshit.length)]}
      </h2>
    </div>
    <div class="mt-4">
      {#if loading}
        <!--<ProgressBar class="items-start justify-start mx-15" />-->
      {/if}
    </div>

    <div class="mt-6">
      {#if dodoAction === "plop"}
        <form autocomplete="off" method="POST" bind:this={form} onsubmit={tryLogin} class="space-y-4">
          <!-- google does not allow autofill to be turned off and chromium will look for words related to the L word so as to circumvent developers and inject autofill. Asshats want to force users to save their passwords in Chrome password manager.
              This is a security risk and a privacy issue as the login details are accessible to anyone who can access the browser. It's also stored on Google server - data of which can be handed over to third parties (authorities).
             This isn't an issue on decent browsers like Firefox (or derivatives). Just Chrome and it's shitty reskinned offspring (pretty much every browser apart from Safari, Firefox, Waterfox, Mulvad and Librewolf). 
             Not sure about safari - likely same as firefox as Apple respects user privacy and security a tiny bit more than the cum stains at google -->
          <div>
            <label for="poopooplop" class="block text-sm font-medium">&#85;&#115;&#101;&#114;&#110;&#97;&#109;&#101;</label>
            <div class="mt-1">
              <Input
                id="poopooplop"
                name="poopooplop"
                type="text"
                autocomplete="off"
                disabled={loading}
                bind:value={user}
                required
                class="input w-full px-3 py-2"
              />
            </div>
          </div>

          <div class="space-y-1">
            <label for="pooplopplop" class="block text-sm font-medium">&#80;&#97;&#115;&#115;&#119;&#111;&#114;&#100;</label>
            <div class="mt-1">
              <Input
                id="pooplopplop"
                name="pooplopplop"
                type="new-password"
                autocomplete="off"
                aria-autocomplete="none"
                disabled={loading}
                bind:value={pass}
                required
                class="input pwd-input w-full px-3 py-2 password-mask"
              />
            </div>
          </div>

          <div>
            <Button type="submit" variant="default" disabled={loading} class="cursor-pointer w-full px-8 py-3 relative"
              >&#76;&#111;&#103;&#105;&#110; &#x21dd;</Button
            >
            <p class="py-4 text-sm">
              <Button type="button" variant="link" class="cursor-pointer text-muted-foreground" onclick={() => (dodoAction = "slop")}
                >&#82;&#101;&#103;&#105;&#115;&#116;&#101;&#114;</Button
              >
              |
              <Button
                type="button"
                variant="link"
                class="cursor-pointer text-muted-foreground"
                onclick={() => (error = "You're scunnered, pal. Due of the way encryption works, you can't recover your password.")}
              >
                &#70;&#111;&#114;&#103;&#111;&#116;&#32;&#80;&#97;&#115;&#115;&#119;&#111;&#114;&#100;
              </Button>
            </p>
          </div>
        </form>
      {:else if dodoAction === "slop"}
        <form autocomplete="off" method="POST" bind:this={nForm} onsubmit={tryRegister} class="space-y-4" transition:slide>
          <div>
            <label for="poopooplop" class="block text-sm font-medium">&#85;&#115;&#101;&#114;&#110;&#97;&#109;&#101;</label>
            <div class="mt-1">
              <Input
                id="poopooplop"
                name="poopooplop"
                type="text"
                autocomplete="off"
                disabled={loading}
                bind:value={user}
                required
                class="input w-full px-3 py-2"
              />
            </div>
          </div>

          <div class="space-y-1">
            <label for="pooplopplop" class="block text-sm font-medium">&#80;&#97;&#115;&#115;&#119;&#111;&#114;&#100;</label>
            <div class="mt-1">
              <Input
                id="pooplopplop"
                name="pooplopplop"
                type="new-password"
                autocomplete="off"
                aria-autocomplete="none"
                disabled={loading}
                bind:value={pass}
                required
                class="input pwd-input w-full px-3 py-2 password-mask"
              />
            </div>
          </div>
          <div class="space-y-1">
            <label for="pooplopplop2" class="block text-sm font-medium"
              >&#67;&#111;&#110;&#102;&#105;&#114;&#109;&#32;&#80;&#97;&#115;&#115;&#119;&#111;&#114;&#100;</label
            >
            <div class="mt-1">
              <Input
                id="pooplopplop2"
                name="pooplopplop2"
                type="new-password"
                autocomplete="off"
                aria-autocomplete="none"
                disabled={loading}
                bind:value={cPass}
                required
                class="input pwd-input w-full px-3 py-2 password-mask"
              />
            </div>
          </div>

          <div>
            <Button type="submit" disabled={loading} class="cursor-pointer w-full px-8 py-3 relative"
              >&#82;&#101;&#103;&#105;&#115;&#116;&#101;&#114; &#x21dd;</Button
            >
            <p class="py-4 text-sm">
              <Button type="button" variant="link" class="text-muted-foreground cursor-pointer" onclick={() => (dodoAction = "plop")}
                >&#76;&#111;&#103;&#105;&#110;</Button
              >
              |
              <Button
                type="button"
                variant="link"
                class="text-muted-foreground cursor-pointer"
                onclick={() => (error = "You're scunnered, pal. Due of the way encryption works, you can't recover your password.")}
              >
                &#70;&#111;&#114;&#103;&#111;&#116;&#32;&#80;&#97;&#115;&#115;&#119;&#111;&#114;&#100;
              </Button>
            </p>
          </div>
        </form>
      {/if}
      {#if error}
        <div class="font-semibold text-red-500">{capitalizeFirstLetters(error)}</div>
      {/if}
    </div>
  </div>
</div>
{#if randomImage}
  <div class="relative hidden w-0 flex-1 lg:block" transition:fade>
    <img class="absolute inset-0 h-full w-full object-cover" src="/static/crl-images/welcome/{randomImage}" alt="" />
  </div>
{/if}

<style>
  .pwd-input {
    -webkit-text-security: disc;
  }
</style>
