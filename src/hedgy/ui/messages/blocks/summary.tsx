"use clients"


export default function Summary(props: {
    content: string
}){
    const { content } = props
    return  (
        <div className="w-full p-2 rounded-md bg-[var(--card-background)] border border-[var(--border-color)] text-sm"  >
            {content}
        </div>
    )
}