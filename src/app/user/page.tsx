import styles from "./user.module.css";
import { HUBS } from "@/src/lib/constants";
import InputsBlock from "@/src/app/components/inputsBlock";
import OptionBar from "@/src/app/components/optionsBar";

export default function User() {
  const text = " stand";
  return (
    <section>
      {/* <OptionBar /> */}
      <div className={`${styles.container} container`}>
        <h2 className={styles.h2}>User stats</h2>
        {Object.entries(HUBS).map(([key, value]) => (
          <InputsBlock
            key={key}
            h3={value.region.name}
            lText={value.owners.faction.name + text}
            lName={value.owners.corporation.alias}
            rText={value.owners.corporation.name + text}
            rName={value.owners.faction.alias}
          />
        ))}
      </div>
    </section>
  );
}
