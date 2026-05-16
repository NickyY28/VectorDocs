import { create } from "zustand";

const usePDFStore = create((set) => ({
  pdfs: [],
  selectedPDF: null,

  setPDFs: (pdfs) => set({ pdfs }),

  addPDF: (pdf) => set((state) => ({ pdfs: [pdf, ...state.pdfs] })),

  removePDF: (id) =>
    set((state) => ({
      pdfs: state.pdfs.filter((p) => p._id !== id),
      selectedPDF: state.selectedPDF?._id === id ? null : state.selectedPDF,
    })),

  selectPDF: (pdf) => set({ selectedPDF: pdf }),
}));

export default usePDFStore;