<script setup>
import { ref } from 'vue'
import { useFactionStore } from './stores/faction'
import SettingsPopupComponent from './components/Popup/SettingsPopupComponent.vue'
import InputTextFieldComponent from './components/FormElements/InputTextFieldComponent.vue'

const factionStore = useFactionStore()
const isSettingsOpen = ref(false)

function openSettings() {
  isSettingsOpen.value = true
}

function closeSettings() {
  isSettingsOpen.value = false
}
</script>

<template>
  <section class="flex">
    <SidebarComponent @openSettings="openSettings" />
    <main class="p-16 w-full ml-80">
      <div class="flex flex-col gap-4">
        <InputTextFieldComponent 
          name="Faction Name" 
          description="Enter faction name" 
          prompt="Think of 10 fantasy nouns, pick one and generate one compelling and memorable faction name for an organization. Keep it concise (1-5 words) and only use words, no markdown. Only respond with one random full faction name, nothing else"
          v-model="factionStore.factionName" 
        />
        <TextareaComponent 
          name="Summary" 
          description="Write a summary" 
          :prompt="`Generate a brief summary describing the faction '${factionStore.factionName}'. Include their nature, purpose, and key characteristics. Keep it concise (2-3 sentences) and only use words, no markdown.`"
          v-model="factionStore.summary" 
        />
        <TextareaComponent 
          name="Mastermind" 
          description="Describe the mastermind" 
          :prompt="`Generate a description of the mastermind of the faction '${factionStore.factionName}' `+ (factionStore.summary.length > 50 ? `which is about ${factionStore.summary}` : '') + `. Include their name, role, and key traits. Keep it concise (2-3 sentences) and only use words, no markdown.`"
          v-model="factionStore.mastermind" 
        />
        <TextareaComponent 
          name="Motivations" 
          description="List the motivations" 
          :prompt="`Generate compelling motivations for the faction '${factionStore.factionName}' `+ (factionStore.summary.length > 50 ? `which is about ${factionStore.summary}` : '') + `. Consider what drives them, their goals, and what they're trying to achieve. Keep it concise (2-3 sentences) and only use words, no markdown.`"
          v-model="factionStore.motivations" 
        />
        <TextareaComponent 
          name="Members" 
          description="Describe the members" 
          :prompt="`Generate a list of the hierarchy of the faction '${factionStore.factionName}' `+ (factionStore.summary.length > 50 ? `which is about ${factionStore.summary}` : '') + `. Include their types, roles, and characteristics. Keep each list item concise (1-3 words) and only output the list, no markdown.`"
          v-model="factionStore.members" 
        />
        <TextareaComponent 
          name="Methods" 
          description="Outline the methods" 
          :prompt="`Generate a description of the methods and tactics of the faction '${factionStore.factionName}' `+ (factionStore.summary.length > 50 ? `which is about ${factionStore.summary}` : '') + `. Include how they operate and achieve their goals. Keep it concise (4-5 sentences) and only use words, no markdown.`"
          v-model="factionStore.methods" 
        />
        <TextareaComponent 
          name="Machinations" 
          description="Detail the machinations" 
          :prompt="`Generate a description of the machinations of the faction '${factionStore.factionName}' `+ (factionStore.summary.length > 50 ? `which is about ${factionStore.summary}` : '') + `. Include their plans and strategies. Keep it concise (4-5 sentences) and only use words, no markdown.`"
          v-model="factionStore.machinations" 
        />
        <TextareaComponent 
          name="Mysteries" 
          description="Explain the mysteries" 
          :prompt="`Generate intriguing mysteries about the faction '${factionStore.factionName}' `+ (factionStore.summary.length > 50 ? `which is about ${factionStore.summary}` : '') + `. Include secrets, unknowns, and questions about them. Keep it concise (4-5 sentences) and only use words, no markdown.`"
          v-model="factionStore.mysteries" 
        />
        <TextareaComponent 
          name="Notes" 
          description="Additional notes" 
          :prompt="`Generate additional notes or interesting details about the faction '${factionStore.factionName}'. Keep it concise (2-3 sentences) and only use words, no markdown.`"
          v-model="factionStore.notes" 
        />
        <MindMapComponent></MindMapComponent>
      </div>
    </main>
    <SettingsPopupComponent :isOpen="isSettingsOpen" @close="closeSettings" />
  </section>
</template>

<style scoped>

</style>
