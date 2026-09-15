import {act,cleanup,render,screen} from "@testing-library/react";
import {afterEach,expect,it,vi} from "vitest";
import {MemoryRouter} from "react-router-dom";
import {InternationalCategories} from "./CommerceCatalogue.js";
const list = vi.hoisted(()=>vi.fn());
vi.mock("../api/catalog-api.js",()=>({listPublicCategories:list}));
afterEach(cleanup);
it("renders the final grid geometry during loading and replaces it with empty state",async()=>{
 let resolve!: (value:unknown)=>void; list.mockReturnValue(new Promise(r=>{resolve=r}));
 const {container}=render(<MemoryRouter><InternationalCategories /></MemoryRouter>);
 expect(screen.getByLabelText("Loading categories")).toHaveClass("commerce-grid");
 expect(container.querySelectorAll(".commerce-grid > li")).toHaveLength(10);
 await act(async()=>{resolve({data:[]});});
 expect(screen.queryByLabelText("Loading categories")).toBeNull();
 expect(screen.getByText(/Tell us what you need/)).toBeInTheDocument();
});
it("shows retry after error, never an empty catalogue or permanent skeleton",async()=>{
 list.mockRejectedValue(new Error("500"));render(<MemoryRouter><InternationalCategories /></MemoryRouter>);
 expect(await screen.findByRole("button",{name:"Retry categories"})).toBeInTheDocument();
 expect(screen.queryByLabelText("Loading categories")).toBeNull();
 expect(screen.queryByText(/Tell us what you need/)).toBeNull();
});
