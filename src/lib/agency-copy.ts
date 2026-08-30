/** Agency / portal labels used in emails and site copy. */
export function agencyCopy(slug: string | undefined | null) {
  const s = (slug ?? "").toLowerCase();
  if (s === "pennsylvania" || s === "pa") {
    return {
      short: "PFBC",
      portal: "HuntFishPA",
      agency: "Pennsylvania Fish and Boat Commission",
    };
  }
  return {
    short: "MDNR",
    portal: "Michigan DNR eLicense",
    agency: "Michigan Department of Natural Resources",
  };
}
