<script lang="ts">
  
  import CiMoon from "~icons/ci/moon";
  import CiSun from "~icons/ci/sun";
  import { Button } from "../button";
</script>

<div class="relative">  
  <CiSun class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
  <CiMoon
    class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
  />
</div>
<span>Toggle theme</span>

