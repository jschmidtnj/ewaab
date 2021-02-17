import { ComponentType } from 'react';
import { OptionProps, OptionTypeBase, components } from 'react-select';

const SelectOption: ComponentType<OptionProps<OptionTypeBase, boolean>> = (
  props
) => {
  delete props.innerProps.onMouseMove;
  delete props.innerProps.onMouseOver;
  return <components.Option {...props}>{props.children}</components.Option>;
};

export default SelectOption;
