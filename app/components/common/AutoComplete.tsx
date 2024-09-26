import { Category } from '@/app/interfaces/categories';
import { useAutocomplete, UseAutocompleteProps } from '@mui/base/useAutocomplete';
import { Popper } from '@mui/base/Popper'
import { styled } from '@mui/system'
import { ForwardedRef, forwardRef } from 'react';
import { unstable_useForkRef as useForkRef } from '@mui/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X as Close } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

function AutoComplete(
  props: UseAutocompleteProps<Category, false, false, false>,
  ref: ForwardedRef<HTMLDivElement>
) {

  const {
    disableClearable = false,
    disabled = false,
    readOnly = false,
    isOptionEqualToValue,
    getOptionLabel,
    autoHighlight,
    ...other
  } = props

  const {
    getInputProps,
    getRootProps,
    getListboxProps,
    getOptionProps,
    getClearProps,
    groupedOptions,
    dirty,
    popupOpen,
    anchorEl,
    setAnchorEl,
  } = useAutocomplete({
    ...props
  })

  const hasClearIcon = !disableClearable && !disabled && dirty && !readOnly
  const rootRef = useForkRef(ref, setAnchorEl)

  return (
    <div className='min-w-[220px]'>
      <div {...getRootProps(other)} ref={rootRef}>
        {hasClearIcon &&
          <div className='flex items-center'>
            <Badge>{props.value?.name}</Badge>
            <div className='grow' />
            <Button {...getClearProps()}
              variant="ghost"
              size="icon"
            >
              <Close />
            </Button>
          </div>
        }

        <Input {...getInputProps()}
          className={`${hasClearIcon ? 'hidden' : 'flex'} tremor-TextInput-root w-full items-center min-w-[10rem] outline-none rounded-tremor-default transition duration-100 border shadow-tremor-input dark:shadow-dark-tremor-input bg-tremor-background dark:bg-dark-tremor-background hover:bg-tremor-background-muted dark:hover:bg-dark-tremor-background-muted text-tremor-content dark:text-dark-tremor-content border-tremor-border dark:border-dark-tremor-border`}
        />

      </div>


      {groupedOptions.length > 0 &&
        <Popper
          open={popupOpen}
          anchorEl={anchorEl}
          placement='bottom-start'
        >
          <ul
            {...getListboxProps()}
            className='my-1 w-[520px] max-h-[300px] overflow-auto drop-shadow-md rounded-lg border z-50 bg-background'
          >
            {(groupedOptions as Category[]).map((option, index) => (
              <li {...getOptionProps({ option, index })}
                key={index}
                className='p-2 cursor-pointer hover:bg-muted'
              >
                <div className='grid grid-cols-3 gap-x-4'>
                  <div>{option.name}</div>
                  <div>{option.date}</div>
                  <div>{option.budget}</div>
                </div>
              </li>
            ))}
          </ul>
        </Popper>
      }

    </div>
  )

}

const blue = {
  100: '#DAECFF',
  200: '#99CCF3',
  400: '#3399FF',
  500: '#007FFF',
  600: '#0072E5',
  700: '#0059B2',
  900: '#003A75',
};

const grey = {
  50: '#F3F6F9',
  100: '#E5EAF2',
  200: '#DAE2ED',
  300: '#C7D0DD',
  400: '#B0B8C4',
  500: '#9DA8B7',
  600: '#6B7A90',
  700: '#434D5B',
  800: '#303740',
  900: '#1C2025',
};

const StyledOption = styled('li')(
  ({ theme }) => `
  list-style: none;
  padding: 8px;
  border-radius: 8px;
  cursor: default;

  &:last-of-type {
    border-bottom: none;
  }

  &:hover {
    cursor: pointer;
  }

  &[aria-selected=true] {
    background-color: ${theme.palette.mode === 'dark' ? blue[900] : blue[100]};
    color: ${theme.palette.mode === 'dark' ? blue[100] : blue[900]};
  }

  &.Mui-focused,
  &.Mui-focusVisible {
    background-color: ${theme.palette.mode === 'dark' ? grey[500] : grey[500]};
    color: ${theme.palette.mode === 'dark' ? grey[300] : grey[900]};
  }

  &.Mui-focusVisible {
    box-shadow: 0 0 0 3px ${theme.palette.mode === 'dark' ? blue[500] : blue[200]};
  }

  &[aria-selected=true].Mui-focused,
  &[aria-selected=true].Mui-focusVisible {
    background-color: ${theme.palette.mode === 'dark' ? blue[900] : blue[100]};
    color: ${theme.palette.mode === 'dark' ? blue[100] : blue[900]};
  }
  `,
);

export default forwardRef(AutoComplete)
