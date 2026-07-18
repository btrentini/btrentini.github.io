function Pandoc(doc)
  local blocks = {}
  local removed_date = false
  local removed_title = false

  for _, block in ipairs(doc.blocks) do
    if not removed_date and block.t == "Para" then
      removed_date = true
    elseif not removed_title and block.t == "Header" and block.level == 1 then
      removed_title = true
    else
      table.insert(blocks, block)
    end
  end

  return pandoc.Pandoc(blocks, doc.meta)
end
