type Props = {
  children?: React.ReactNode;
  className?: string;
};

export function Container({ children, className = "" }: Props) {
  return <div className={`mx-auto w-full max-w-5xl px-4 sm:px-6 ${className}`}>{children}</div>;
}
