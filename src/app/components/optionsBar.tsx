import styles from "./optionsBar.module.css";
import InputsBlock from "./inputsBlock";
import { tradeSettings } from "@/src/lib/settings";
class OptionCreator {
  h3: string;
  lText: string;
  lName: string;
  rText: string;
  rName: string;

  constructor(option: string) {
    const capitalized = this.setCapitalLetter(option);
    const low = option.toLowerCase();
    this.h3 = capitalized;
    this.lText = `${capitalized} minimum`;
    this.lName = `${low}_minimum`;
    this.rText = `${capitalized} maximum`;
    this.rName = `${low}_maximum`;
  }
  private setCapitalLetter(w: string): string {
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  }
}

export default function OptionBar() {
  const settings: OptionCreator[] = [
    new OptionCreator("price"),
    new OptionCreator("volume"),
    new OptionCreator("margin"),
  ];
  return (
    <div className={styles.overview}>
      <div className={`${styles.container} container`}>
        <h2 className={styles.h2}>Market settings</h2>
        {settings.map((item, index) => (
          <InputsBlock
            key={index}
            h3={item.h3}
            lText={item.lText}
            lName={item.lName}
            rText={item.rText}
            rName={item.rName}
          />
        ))}
      </div>
    </div>
  );
}
