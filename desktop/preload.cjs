// Ponte mínima entre a página do CRM e o app desktop (sem expor o Node à página).
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("crmDesktop", {
  info: () => ipcRenderer.invoke("crm:info"),
  abrirPastaDados: () => ipcRenderer.invoke("crm:abrir-pasta"),
  salvarBackup: () => ipcRenderer.invoke("crm:salvar-backup"),

  atualizacao: {
    estado: () => ipcRenderer.invoke("crm:atualizacao-estado"),
    baixar: () => ipcRenderer.invoke("crm:atualizacao-baixar"),
    dispensar: () => ipcRenderer.invoke("crm:atualizacao-dispensar"),
    instalar: () => ipcRenderer.invoke("crm:atualizacao-instalar"),
    /** Avisa a página quando o estado muda. Devolve a função para parar de ouvir. */
    aoMudar: (callback) => {
      const ouvinte = (_evento, estado) => callback(estado);
      ipcRenderer.on("crm:atualizacao", ouvinte);
      return () => ipcRenderer.removeListener("crm:atualizacao", ouvinte);
    },
  },
});
